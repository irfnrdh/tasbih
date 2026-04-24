#!/bin/bash

# Configuration
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export ANDROID_HOME=/opt/android-sdk
export PATH=$JAVA_HOME/bin:$PATH

echo "🚀 Memulai proses build APK..."

# 1. Build Web Assets
echo "📦 Building web assets..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Gagal melakukan build web assets."
    exit 1
fi

# 2. Sync Capacitor
echo "🔄 Synchronizing Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Error: Gagal sinkronisasi Capacitor."
    exit 1
fi

# 3. Build Android APK
echo "🤖 Building Android APK..."
cd android
./gradlew assembleDebug
if [ $? -ne 0 ]; then
    echo "❌ Error: Gagal build APK."
    exit 1
fi

cd ..

echo "✅ Build Selesai!"
echo "📍 Lokasi APK: android/app/build/outputs/apk/debug/app-debug.apk"
ls -lh android/app/build/outputs/apk/debug/app-debug.apk
