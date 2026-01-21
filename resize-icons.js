const fs = require('fs');
const path = require('path');





const sourceIcon = 'assets/logo.png';
const androidResDir = 'android/app/src/main/res';


const androidSizes = {
  'drawable-ldpi': 36,
  'drawable-mdpi': 48,
  'drawable-hdpi': 72,
  'drawable-xhdpi': 96,
  'drawable-xxhdpi': 144,
  'drawable-xxxhdpi': 192
};





console.log('Copying icon to Android drawable directories...');

Object.keys(androidSizes).forEach(density => {
  const destDir = path.join(androidResDir, density);
  const destFile = path.join(destDir, 'ic_launcher.png');


  if (fs.existsSync(sourceIcon) && fs.existsSync(destDir)) {
    fs.copyFileSync(sourceIcon, destFile);
    console.log(`Copied icon to ${destFile}`);
  } else {
    console.log(`Directory ${destDir} or source file ${sourceIcon} does not exist`);
  }
});


const playstoreDir = path.join(androidResDir, 'mipmap-anydpi-v26');
if (!fs.existsSync(playstoreDir)) {
  fs.mkdirSync(playstoreDir, { recursive: true });
}
const playstoreFile = path.join(playstoreDir, 'ic_launcher.png');
if (fs.existsSync(sourceIcon)) {
  fs.copyFileSync(sourceIcon, playstoreFile);
  console.log(`Created playstore icon at ${playstoreFile}`);
}


const adaptiveFile = path.join(playstoreDir, 'ic_launcher_round.xml');
const adaptiveIconContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
fs.writeFileSync(adaptiveFile, adaptiveIconContent);
console.log(`Created adaptive icon at ${adaptiveFile}`);


const valuesDir = path.join(androidResDir, 'values');
if (!fs.existsSync(valuesDir)) {
  fs.mkdirSync(valuesDir, { recursive: true });
}
const colorsFile = path.join(valuesDir, 'ic_launcher_background.xml');
const colorsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>`;
fs.writeFileSync(colorsFile, colorsContent);
console.log(`Created color resource at ${colorsFile}`);


const splashDir = path.join(androidResDir, 'drawable');
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
}
const splashFile = path.join(splashDir, 'splash.png');
if (fs.existsSync(sourceIcon)) {
  fs.copyFileSync(sourceIcon, splashFile);
  console.log(`Created splash screen at ${splashFile}`);
}


const layoutDir = path.join(androidResDir, 'layout');
if (!fs.existsSync(layoutDir)) {
  fs.mkdirSync(layoutDir, { recursive: true });
}
const splashLayoutFile = path.join(layoutDir, 'splash.xml');
const splashLayoutContent = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:gravity="center"
    android:orientation="vertical"
    android:background="#FFFFFF">
    <ImageView
        android:layout_width="200dp"
        android:layout_height="200dp"
        android:src="@drawable/splash"
        android:scaleType="centerInside" />
</LinearLayout>`;
fs.writeFileSync(splashLayoutFile, splashLayoutContent);
console.log(`Created splash layout at ${splashLayoutFile}`);

console.log('Icon and splash screen copying completed!');