package com.langpub

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.langpub.utils.EpubParser
import com.langpub.ui.EpubViewer
import com.langpub.ui.theme.LangPubTheme
import com.langpub.utils.EpubContent

class MainActivity : ComponentActivity() {
    private var epubContent by mutableStateOf<EpubContent?>(null)

    private val openDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        uri?.let { selectedUri ->
            contentResolver.takePersistableUriPermission(
                selectedUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            )

            try {
                contentResolver.openInputStream(selectedUri)?.use { inputStream ->
                    epubContent = EpubParser.parseEpubContent(inputStream)
                }
            } catch (e: Exception) {
                Log.e("EPUB_ERROR", "Error processing epub", e)
            }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            var loadingProgress by remember { mutableStateOf(0f) }
            var showMenu by remember { mutableStateOf(false) }

            LangPubTheme {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer,
                                titleContentColor = MaterialTheme.colorScheme.primary,
                            ),
                            title = {
                                Text("LangPub")
                            },
                            actions = {
                                Box {
                                    IconButton(
                                        onClick = { showMenu = true }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.MoreVert,
                                            contentDescription = "More options"
                                        )
                                    }

                                    DropdownMenu(
                                        expanded = showMenu,
                                        onDismissRequest = { showMenu = false }
                                    ) {
                                        DropdownMenuItem(
                                            text = { Text("Open Epub") },
                                            onClick = {
                                                showMenu = false
                                                openDocumentLauncher.launch(arrayOf(
                                                    "application/epub+zip",
                                                    "application/zip"
                                                ))
                                            }
                                        )
                                    }
                                }
                            }
                        )
                    },
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        epubContent?.let { content ->
                            EpubViewer(
                                epubContent = content,
                                onLoadProgress = { progress ->
                                    loadingProgress = progress
                                },
                                onWordClick = { word ->
                                    Log.d("WORD_CLICK", "Clicked word: $word")
                                }
                            )
                        } ?: run {
                            // Show welcome message when no book is loaded
                            Column(
                                modifier = Modifier.fillMaxSize(),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "Open an epub file to start reading",
                                    style = MaterialTheme.typography.headlineSmall
                                )
                            }
                        }

                        // Optional loading indicator
                        LinearProgressIndicator(
                            progress = loadingProgress,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(4.dp)
                                .align(Alignment.TopCenter)
                        )
                    }
                }
            }
        }
    }
}