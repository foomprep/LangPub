package com.langpub.utils

import android.util.Log
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import java.net.HttpURLConnection
import java.net.URL
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.io.InputStream
import java.io.StringReader
import java.util.zip.ZipInputStream

@Serializable
data class LanguageDetectionResponse(
    val language: String
)

class EpubParser {
    companion object {
        private suspend fun detectLanguage(text: String): String? {
            return withContext(Dispatchers.IO) {
                var connection: HttpURLConnection? = null
                try {
                    val url = URL("https://tongues.directto.link/language")
                    connection = url.openConnection() as HttpURLConnection

                    connection.requestMethod = "POST"
                    connection.setRequestProperty("Content-Type", "application/json")
                    connection.doOutput = true
                    connection.doInput = true

                    // Create a JSON object with the text
                    val requestBody = Json.encodeToString(
                        mapOf("text" to text)
                    )

                    connection.outputStream.use { os ->
                        val input = requestBody.toByteArray(Charsets.UTF_8)
                        os.write(input, 0, input.size)
                    }

                    val json = Json { ignoreUnknownKeys = true }
                    val responseCode = connection.responseCode
                    if (responseCode == HttpURLConnection.HTTP_OK) {
                        val response = connection.inputStream.bufferedReader().use { it.readText() }
                        Log.d("LANGUAGE_DETECTTION", "Language detected: $response")
                        val result = json.decodeFromString<LanguageDetectionResponse>(response)
                        result.language
                    } else {
                        Log.e("LANGUAGE_DETECTION", "HTTP error: $responseCode")
                        null
                    }
                } catch (e: Exception) {
                    Log.e("LANGUAGE_DETECTION", "Error detecting language: ${e.message}")
                    null
                } finally {
                    connection?.disconnect()
                }
            }
        }

        private fun extractTextChunk(content: String, maxLength: Int = 500): String {
            // Remove HTML tags
            val cleanedText = content
                .replace(Regex("<[^>]*>"), " ")  // Remove HTML tags
                .replace(Regex("\\s+"), " ")     // Normalize whitespace
                .trim()

            // Return first 500 characters (or specified max length)
            return cleanedText.take(maxLength)
        }

        fun parseEpubContent(inputStream: InputStream): EpubContent {
            val entries = mutableMapOf<String, String>()
            var foundOpfPath: String? = null
            var foundOpfContent: String? = null

            // First pass: read all entries and find OPF
            ZipInputStream(inputStream.buffered()).use { zipStream ->
                var entry = zipStream.nextEntry
                while (entry != null) {
                    Log.d("ZIP_DEBUG", "Reading entry: ${entry.name}")
                    val content = zipStream.bufferedReader().readText()
                    entries[entry.name] = content

                    when {
                        entry.name == "META-INF/container.xml" -> {
                            val parser = XmlPullParserFactory.newInstance().newPullParser()
                            parser.setInput(StringReader(content))

                            var eventType = parser.eventType
                            while (eventType != XmlPullParser.END_DOCUMENT) {
                                if (eventType == XmlPullParser.START_TAG && parser.name == "rootfile") {
                                    foundOpfPath = parser.getAttributeValue(null, "full-path")
                                    Log.d("OPF_PATH", "Found OPF path in container.xml: $foundOpfPath")
                                }
                                eventType = parser.next()
                            }
                        }
                        entry.name.endsWith(".opf") -> {
                            if (foundOpfPath == null) {
                                foundOpfPath = entry.name
                                foundOpfContent = content
                                Log.d("OPF_PATH", "Found OPF by extension: ${entry.name}")
                            }
                        }
                    }
                    entry = zipStream.nextEntry
                }
            }

            val opfPath = foundOpfPath ?: throw IllegalStateException("No OPF file found in epub")
            val opfContent = foundOpfContent ?: entries[opfPath]
            ?: throw IllegalStateException("OPF file not found at path: $opfPath")

            val opfFolder = opfPath.substringBeforeLast('/')
            val parser = XmlPullParserFactory.newInstance().newPullParser()
            parser.setInput(StringReader(opfContent))

            val manifestItems = mutableMapOf<String, String>() // id to href
            val spineItemRefs = mutableListOf<String>() // list of idref

            var eventType = parser.eventType
            while (eventType != XmlPullParser.END_DOCUMENT) {
                if (eventType == XmlPullParser.START_TAG) {
                    when (parser.name) {
                        "item" -> {
                            val id = parser.getAttributeValue(null, "id")
                            val href = parser.getAttributeValue(null, "href")
                            if (id != null && href != null) {
                                manifestItems[id] = href
                                Log.d("MANIFEST_DEBUG", "Found manifest item - ID: $id, Href: $href")
                            }
                        }
                        "itemref" -> {
                            val idref = parser.getAttributeValue(null, "idref")
                            if (idref != null) {
                                spineItemRefs.add(idref)
                                Log.d("SPINE_DEBUG", "Found spine itemref: $idref")
                            }
                        }
                    }
                }
                eventType = parser.next()
            }

            // Improved content retrieval with multiple path attempts
            val spineItems = spineItemRefs.mapNotNull { idref ->
                val href = manifestItems[idref] ?: return@mapNotNull null

                // Try multiple possible paths
                val possiblePaths = listOf(
                    href,                           // Exact href
                    "$opfFolder/$href",             // Relative to OPF folder
                    "OPS/$href",                    // Common EPUB structure
                    "OEBPS/$href"                   // Alternative common structure
                )

                val content = possiblePaths.firstNotNullOfOrNull { path ->
                    entries[path].also {
                        Log.d("CONTENT_DEBUG", "Trying to read file: $path, Found: ${it != null}")
                    }
                } ?: ""

                SpineItem(
                    id = idref,
                    href = href,
                    content = content
                )
            }

            // Detect language from the second spine item
            val detectedLanguage = if (spineItems.size > 2) {
                val thirdChapterContent = spineItems[2].content
                val textChunk = extractTextChunk(thirdChapterContent)
                runBlocking {
                    detectLanguage(textChunk) ?: "Unknown"
                }
            } else "Unknown"

            Log.d("EPUB", "Found ${spineItems.size} spine items")
            return EpubContent(
                spineItems = spineItems,
                language = detectedLanguage
            )
        }
    }
}