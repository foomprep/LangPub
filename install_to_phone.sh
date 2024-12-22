#!/bin/bash

# Function to select device
select_device() {
    # Get list of connected devices
    devices=($(adb devices | grep -v "List" | grep "device$" | cut -f1))
    
    if [ ${#devices[@]} -eq 0 ]; then
        echo "No devices connected!"
        exit 1
    elif [ ${#devices[@]} -eq 1 ]; then
        echo "Only one device connected. Using ${devices[0]}"
        selected_device=${devices[0]}
    else
        echo "Multiple devices found. Please select a device:"
        select device in "${devices[@]}"; do
            if [ -n "$device" ]; then
                selected_device=$device
                break
            fi
        done
    fi
    
    echo "Selected device: $selected_device"
}

# Main script
current_dir=$(pwd)
cd $current_dir
cd android
./gradlew tasks
cd ..

# Bundle the app
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

cd android
./gradlew assembleDebug

# Select device and install
select_device
adb -s $selected_device install app/build/outputs/apk/debug/app-debug.apk
