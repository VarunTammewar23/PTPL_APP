package com.tempapp

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.*
import com.facebook.react.bridge.ActivityEventListener

class FilePickerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pickerPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "FilePickerModule"

    @ReactMethod
    fun openFilePicker(promise: Promise) {
        pickerPromise = promise

        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            addCategory(Intent.CATEGORY_OPENABLE)
        }

        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is not available")
            return
        }

        activity.startActivityForResult(
            Intent.createChooser(intent, "Select Excel File"),
            FILE_PICKER_REQUEST_CODE
        )
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode != FILE_PICKER_REQUEST_CODE) return

        if (resultCode == Activity.RESULT_OK && data != null) {
            val uri: Uri? = data.data
            pickerPromise?.resolve(uri.toString())
        } else {
            pickerPromise?.reject("CANCELLED", "User cancelled selection")
        }
    }

    override fun onNewIntent(intent: Intent) {
        // not used but required for interface
    }

    companion object {
        private const val FILE_PICKER_REQUEST_CODE = 9001
    }
}
