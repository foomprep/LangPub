package com.langpub.utils

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

@Serializable
data class TranslationRequest(
    val language: String,
    val text: String
)

@Serializable
data class TranslationResponse(
    val translated_text: String? = null
)

@Serializable
data class VerbTensesResponse(
    val message: String
)

@Serializable
data class SpeechRequest(
    val language: String,
    val text: String
)

object TranslationService {
    suspend fun fetchTranslation(
        word: String,
        language: String
    ): TranslationResponse {
        return withContext(Dispatchers.IO) {
            var connection: HttpURLConnection? = null
            try {
                val url = URL("https://tongues.directto.link/translate")
                connection = url.openConnection() as HttpURLConnection

                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true

                val requestBody = Json.encodeToString(
                    TranslationRequest(
                        language = language,
                        text = word
                    )
                )

                connection.outputStream.use { os ->
                    val input = requestBody.toByteArray(Charsets.UTF_8)
                    os.write(input, 0, input.size)
                }

                val json = Json { ignoreUnknownKeys = true }
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().use { it.readText() }
                    json.decodeFromString<TranslationResponse>(response)
                } else {
                    TranslationResponse()
                }
            } catch (e: IOException) {
                TranslationResponse()
            } finally {
                connection?.disconnect()
            }
        }
    }

    suspend fun fetchSpeech(
        text: String,
        language: String
    ): ByteArray? {
        return withContext(Dispatchers.IO) {
            var connection: HttpURLConnection? = null
            try {
                val url = URL("https://tongues.directto.link/speech")
                connection = url.openConnection() as HttpURLConnection

                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true
                connection.doInput = true

                val requestBody = Json.encodeToString(
                    SpeechRequest(
                        language = language,
                        text = text
                    )
                )

                connection.outputStream.use { os ->
                    val input = requestBody.toByteArray(Charsets.UTF_8)
                    os.write(input, 0, input.size)
                }

                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    connection.inputStream.use { inputStream ->
                        val buffer = ByteArrayOutputStream()
                        val data = ByteArray(1024)
                        var bytesRead: Int
                        while (inputStream.read(data, 0, data.size).also { bytesRead = it } != -1) {
                            buffer.write(data, 0, bytesRead)
                        }
                        buffer.toByteArray()
                    }
                } else {
                    Log.e("SPEECH_ERROR", "HTTP error: $responseCode")
                    null
                }
            } catch (e: Exception) {
                Log.e("SPEECH_ERROR", "Error fetching speech: ${e.message}")
                null
            } finally {
                connection?.disconnect()
            }
        }
    }

    suspend fun fetchVerbTenses(verb: String): VerbTensesResponse {
        return withContext(Dispatchers.IO) {
            var connection: HttpURLConnection? = null
            try {
                val url = URL("https://tongues.directto.link/verb-tenses")
                connection = url.openConnection() as HttpURLConnection

                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true

                val requestBody = Json.encodeToString(
                    mapOf("verb" to verb)
                )

                connection.outputStream.use { os ->
                    val input = requestBody.toByteArray(Charsets.UTF_8)
                    os.write(input, 0, input.size)
                }

                val json = Json { ignoreUnknownKeys = true }
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().use { it.readText() }
                    json.decodeFromString<VerbTensesResponse>(response)
                } else {
                    VerbTensesResponse("Failed to fetch verb tenses")
                }
            } catch (e: IOException) {
                VerbTensesResponse("Error: ${e.message}")
            } finally {
                connection?.disconnect()
            }
        }
    }
}