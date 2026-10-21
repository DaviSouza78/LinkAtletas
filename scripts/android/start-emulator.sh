#!/usr/bin/env bash
set -euo pipefail
export ANDROID_USER_HOME="$RUNNER_TEMP/linkatletas-android"
export ANDROID_EMULATOR_HOME="$ANDROID_USER_HOME"
export ANDROID_AVD_HOME="$ANDROID_USER_HOME/avd"
mkdir -p emulator-evidence "$ANDROID_AVD_HOME"
sdkmanager_path=$(find "$ANDROID_HOME/cmdline-tools" -type f -name sdkmanager -print -quit)
test -n "$sdkmanager_path"
export PATH="$(dirname "$sdkmanager_path"):$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
printf '%s\n' "$(dirname "$sdkmanager_path")" "$ANDROID_HOME/platform-tools" "$ANDROID_HOME/emulator" >> "$GITHUB_PATH"
sudo chmod 666 /dev/kvm
sdkmanager 'emulator' 'platform-tools' 'system-images;android-35;google_apis;x86_64'
avdmanager create avd -n linkatletas -k 'system-images;android-35;google_apis;x86_64' --device pixel_6 --path "$ANDROID_AVD_HOME/linkatletas.avd" --force <<< 'no'
test -f "$ANDROID_AVD_HOME/linkatletas.avd/config.ini"
"$ANDROID_HOME/emulator/emulator" -avd linkatletas -no-window -no-audio -no-snapshot -no-boot-anim -gpu swiftshader_indirect > emulator-evidence/emulator.log 2>&1 &
timeout 180 adb wait-for-device
timeout 300 bash -c 'until adb shell getprop sys.boot_completed | grep -q 1; do sleep 2; done'
adb shell input keyevent 82
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
