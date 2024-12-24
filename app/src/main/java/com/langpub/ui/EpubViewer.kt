@file:OptIn(ExperimentalLayoutApi::class)

package com.langpub.ui

import android.media.MediaPlayer
import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.langpub.utils.EpubContent
import com.langpub.utils.TranslationService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import kotlin.math.abs

@Composable
fun EpubViewer(
    modifier: Modifier = Modifier,
    epubContent: EpubContent,
    onLoadProgress: (Float) -> Unit = {},
    onWordClick: (String) -> Unit = {}
) {
    var currentChapterIndex by remember(epubContent.spineItems) { mutableIntStateOf(0) }
    val currentChapter = epubContent.spineItems.getOrNull(currentChapterIndex)
    var selectedWord by remember(epubContent.spineItems) { mutableStateOf<String?>(null) }
    var translation by remember(epubContent.spineItems) { mutableStateOf<String?>(null) }
    var isLoading by remember(epubContent.spineItems) { mutableStateOf(false) }
    var errorMessage by remember(epubContent.spineItems) { mutableStateOf<String?>(null) }
    var verbTenses by remember(epubContent.spineItems) { mutableStateOf<String?>(null) }
    var isLoadingTenses by remember(epubContent.spineItems) { mutableStateOf(false) }

    val detectedLanguage = epubContent.language

    val navigateChapter = { forward: Boolean ->
        if (forward && currentChapterIndex < epubContent.spineItems.size - 1) {
            currentChapterIndex++
            onLoadProgress(currentChapterIndex.toFloat() / epubContent.spineItems.size)
        } else if (!forward && currentChapterIndex > 0) {
            currentChapterIndex--
            onLoadProgress(currentChapterIndex.toFloat() / epubContent.spineItems.size)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
            // Add horizontal drag gesture detection
            .pointerInput(epubContent.spineItems) {
                var totalDragAmount = 0f
                detectHorizontalDragGestures(
                    onDragEnd = {
                        // Only trigger navigation when total drag amount is significant
                        if (abs(totalDragAmount) > 50) {
                            // Negative totalDragAmount means swipe left-to-right (next chapter)
                            // Positive totalDragAmount means swipe right-to-left (previous chapter)
                            navigateChapter(totalDragAmount < 0)
                        }
                        totalDragAmount = 0f
                    },
                    onDragCancel = { totalDragAmount = 0f },
                    onDragStart = { totalDragAmount = 0f },
                    onHorizontalDrag = { change, dragAmount ->
                        change.consume()
                        totalDragAmount += dragAmount
                    }
                )
            }
    ) {
        // Chapter counter
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Chapter ${currentChapterIndex + 1} of ${epubContent.spineItems.size}",
                style = MaterialTheme.typography.bodyLarge
            )
        }

        // Content display
        currentChapter?.let { chapter ->
            ChapterContent(
                content = chapter.content,
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.surface),
                onWordClick = { word ->
                    selectedWord = word
                    onWordClick(word)
                }
            )
        }

        selectedWord?.let { word ->
            LaunchedEffect(word) {
                isLoading = true
                translation = null
                errorMessage = null
                try {
                    val translationResult = TranslationService.fetchTranslation(word, detectedLanguage)
                    translation = translationResult.translated_text
                } catch (e: Exception) {
                    errorMessage = "Translation failed: ${e.message}"
                    Log.e("NETWORK_ERROR", errorMessage.toString())
                } finally {
                    isLoading = false
                }
            }

            AlertDialog(
                onDismissRequest = {
                    selectedWord = null
                    verbTenses = null
                },
                text = {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = LocalConfiguration.current.screenHeightDp.dp * 0.8f)
                            .padding(vertical = 4.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier
                                    .size(24.dp)
                                    .align(Alignment.CenterHorizontally)
                            )
                        }

                        errorMessage?.let { error ->
                            Text(
                                text = error,
                                color = MaterialTheme.colorScheme.error
                            )
                        }

                        translation?.let { trans ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(word)
                                    Text(
                                        text = trans,
                                        style = MaterialTheme.typography.headlineLarge
                                    )
                                }

                                SpeechButton(
                                    text = word,
                                    language = detectedLanguage
                                )
                            }

                            IconButton(
                                onClick = {
                                    isLoadingTenses = true
                                    kotlinx.coroutines.CoroutineScope(Dispatchers.Main).launch {
                                        try {
                                            val result = TranslationService.fetchVerbTenses(word)
                                            verbTenses = result.message
                                        } catch (e: Exception) {
                                            Log.e("VERB_TENSES_ERROR", "Error fetching tenses: ${e.message}")
                                        } finally {
                                            isLoadingTenses = false
                                        }
                                    }
                                },
                                modifier = Modifier.align(Alignment.CenterHorizontally)
                            ) {
                                if (isLoadingTenses) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(24.dp)
                                    )
                                } else {
                                    Icon(
                                        imageVector = Icons.Default.KeyboardArrowDown,
                                        contentDescription = "View Verb Tenses"
                                    )
                                }
                            }

                            verbTenses?.let { tenses ->
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .weight(1f)
                                ) {
                                    Text(
                                        text = tenses,
                                        style = MaterialTheme.typography.bodyLarge,
                                        modifier = Modifier
                                            .verticalScroll(rememberScrollState())
                                            .padding(top = 8.dp)
                                    )
                                }
                            }
                        }
                    }
                },
                confirmButton = {}
            )
        }
    }
}

@Composable
fun ChapterContent(
    content: String,
    modifier: Modifier = Modifier,
    onWordClick: (String) -> Unit
) {
    val cleanedScripts = content.replace(Regex("<script.*?</script>", RegexOption.DOT_MATCHES_ALL), "")
    val cleanedStyles = cleanedScripts.replace(Regex("<style.*?</style>", RegexOption.DOT_MATCHES_ALL), "")
    val withoutTags = cleanedStyles.replace(Regex("<.*?>"), "\n")

    val paragraphs = withoutTags
        .split("\n")
        .filter { it.isNotBlank() }
        .map { it.trim() }

    LazyColumn(modifier = modifier) {
        items(paragraphs) { paragraph ->
            val words = paragraph.split(Regex("\\s+")).toList()

            FlowRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                words.forEach { word ->
                    Text(
                        text = "$word ",
                        modifier = Modifier
                            .clickable { onWordClick(word) }
                            .padding(horizontal = 2.dp),
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontSize = 24.sp  // Increased font size
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun SpeechButton(
    text: String,
    language: String
) {
    val context = LocalContext.current
    var isLoading by remember { mutableStateOf(false) }
    var mediaPlayer: MediaPlayer? by remember { mutableStateOf(null) }

    DisposableEffect(Unit) {
        onDispose {
            mediaPlayer?.release()
            mediaPlayer = null
        }
    }

    Button(
        onClick = {
            isLoading = true
            // Coroutine to fetch and play speech
            kotlinx.coroutines.CoroutineScope(Dispatchers.Main).launch {
                try {
                    val speechBytes = TranslationService.fetchSpeech(text, language)
                    speechBytes?.let { bytes ->
                        // Create a temporary file to store the MP3
                        val tempFile = File(context.cacheDir, "speech_${System.currentTimeMillis()}.mp3")
                        FileOutputStream(tempFile).use { it.write(bytes) }

                        // Create and prepare MediaPlayer
                        mediaPlayer?.release()
                        mediaPlayer = MediaPlayer().apply {
                            setDataSource(tempFile.absolutePath)
                            prepare()
                            start()
                        }
                    }
                } catch (e: Exception) {
                    Log.e("SPEECH_ERROR", "Error playing speech: ${e.message}")
                } finally {
                    isLoading = false
                }
            }
        },
        modifier = Modifier.padding(top = 8.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = MaterialTheme.colorScheme.onPrimary
            )
        } else {
            Icon(
                imageVector = Icons.Default.PlayArrow,
                contentDescription = "Play Speech"
            )
        }
    }
}