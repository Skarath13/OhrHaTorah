#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
    echo "Usage: $0 DESKTOP_SOURCE MOBILE_SOURCE [OUTPUT_DIRECTORY]" >&2
    exit 64
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "ffmpeg is required to build the hero loops." >&2
    exit 69
fi

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "$script_directory/.." && pwd)"
desktop_source="$1"
mobile_source="$2"
output_directory="${3:-$repository_root/public/media/hero}"

desktop_sha256="dcf4bc47af7e38ef4466cce7d353a50e7be1bef5fb3de29a3deb22b05199c5e6"
mobile_sha256="5ea4a13a204fdcf2b80352bfd8d2d4335cd6913260422b2aef23676de9e9d153"

verify_source() {
    local source_file="$1"
    local expected_sha256="$2"
    local actual_sha256

    if [[ ! -f "$source_file" ]]; then
        echo "Source video not found: $source_file" >&2
        exit 66
    fi

    actual_sha256="$(shasum -a 256 "$source_file" | awk '{ print $1 }')"
    if [[ "$actual_sha256" != "$expected_sha256" ]]; then
        echo "Source checksum mismatch: $source_file" >&2
        echo "Expected: $expected_sha256" >&2
        echo "Actual:   $actual_sha256" >&2
        exit 65
    fi
}

build_loop() {
    local source_file="$1"
    local variant="$2"
    local padded_start="$3"
    local padded_end="$4"
    local crop_filter="$5"
    local scale_filter="$6"
    local output_base="$output_directory/ohr-hatorah-hero-$variant-loop-v3"

    ffmpeg -hide_banner -i "$source_file" \
        -filter_complex "[0:v]trim=start=$padded_start:end=$padded_end,setpts=PTS-STARTPTS,crop=$crop_filter,scale=$scale_filter:flags=lanczos,minterpolate=fps=100:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,trim=start=0.04:end=4.73,setpts=PTS-STARTPTS,setpts='if(lt(N/468,0.013157895),4.68*sqrt(0.049967127*(N/468)),if(gt(N/468,0.986842105),4.68*(1-sqrt(0.049967127*(1-N/468))),4.68*((N/468)*0.974358974+0.012820513)))/TB',tpad=stop_mode=clone:stop_duration=0.04,fps=25,format=yuv420p,split=2[f][r];[f]trim=start_frame=0:end_frame=118,setpts=PTS-STARTPTS[f0];[r]reverse,trim=start_frame=1:end_frame=117,setpts=PTS-STARTPTS[r0];[f0][r0]concat=n=2:v=1:a=0,split=2[mp4][webm]" \
        -map "[mp4]" -an \
        -c:v libx264 -preset slow -crf 23 -profile:v high -level:v 4.1 \
        -g 50 -keyint_min 50 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart \
        -y "$output_base.mp4" \
        -map "[webm]" -an \
        -c:v libvpx-vp9 -crf 31 -b:v 0 -deadline good -cpu-used 2 -row-mt 1 \
        -g 50 -pix_fmt yuv420p \
        -y "$output_base.webm"
}

verify_source "$desktop_source" "$desktop_sha256"
verify_source "$mobile_source" "$mobile_sha256"
mkdir -p "$output_directory"

# Interpolate one source-frame interval around each selected window so the
# 100 fps motion analysis has real neighboring frames at both boundaries.
build_loop "$desktop_source" desktop 1.96 6.80 3840:2160:128:0 1920:1080
build_loop "$mobile_source" mobile 3.96 8.80 1440:2560:0:86 1080:1920
