package com.tempapp

import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.tempapp.FilePickerModule

class MainActivity : ReactActivity() {

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)

    val reactContext = (application as MainApplication).reactHost.currentReactContext
    reactContext
      ?.getNativeModule(FilePickerModule::class.java)
      ?.onActivityResult(requestCode, resultCode, data)
  }

  override fun getMainComponentName(): String = "TempApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
