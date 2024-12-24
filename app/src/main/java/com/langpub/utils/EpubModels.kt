package com.langpub.utils

data class SpineItem(
    val id: String,
    val href: String,
    val content: String
)

data class EpubContent(
    val spineItems: List<SpineItem>,
    val language: String = "Unknown"
)