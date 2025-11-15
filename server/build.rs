use std::fs;
use std::io::Write;
use std::path::Path;
use flate2::read::GzDecoder;
use tar::Archive;

fn main() {
    // Download cloudflared binary
    download_cloudflared();
}

fn download_cloudflared() {
    let bin_dir = Path::new("bin");
    fs::create_dir_all(&bin_dir).expect("Failed to create bin directory");

    // Determine the current target platform
    let (download_name, is_tgz) = if cfg!(target_os = "windows") {
        ("cloudflared-windows-amd64.exe", false)
    } else if cfg!(target_os = "macos") {
        ("cloudflared-darwin-amd64.tgz", true)
    } else if cfg!(target_os = "linux") {
        ("cloudflared-linux-amd64", false)
    } else {
        panic!("Unsupported target platform");
    };

    let target_triple = if cfg!(target_os = "windows") {
        "x86_64-pc-windows-msvc.exe"
    } else if cfg!(target_os = "macos") {
        "x86_64-apple-darwin"
    } else if cfg!(target_os = "linux") {
        "x86_64-unknown-linux-gnu"
    } else {
        panic!("Unsupported target platform");
    };

    let target_path = bin_dir.join(format!("cloudflared-{}", target_triple));

    // Skip if already exists
    if target_path.exists() {
        println!("cargo:warning={} already exists, skipping download", target_path.display());
        return;
    }

    let url = format!(
        "https://github.com/cloudflare/cloudflared/releases/latest/download/{}",
        download_name
    );

    println!("cargo:warning=Downloading {} to {}", url, target_path.display());

    // Download the file using reqwest (blocking)
    let response = reqwest::blocking::get(&url)
        .expect(&format!("Failed to download cloudflared from {}", url));
    
    if !response.status().is_success() {
        panic!("Failed to download {}: HTTP {}", download_name, response.status());
    }

    // Download and process the file
    if is_tgz {
        // For macOS, download and extract the tar.gz
        let temp_path = bin_dir.join("temp.tgz");
        let mut file = fs::File::create(&temp_path)
            .expect("Failed to create temp file");
        let content = response.bytes().expect("Failed to read response body");
        file.write_all(&content)
            .expect("Failed to write downloaded file");

        // Extract the tar.gz using flate2 and tar crates
        let tar_gz = fs::File::open(&temp_path)
            .expect("Failed to open downloaded tar.gz");
        let tar = GzDecoder::new(tar_gz);
        let mut archive = Archive::new(tar);
        
        let temp_dir = bin_dir.join("temp");
        fs::create_dir_all(&temp_dir).expect("Failed to create temp directory");
        
        archive.unpack(&temp_dir)
            .expect("Failed to extract tar.gz");

        // Move the extracted binary
        let extracted_path = temp_dir.join("cloudflared");
        if !extracted_path.exists() {
            panic!("Extracted binary not found at {}", extracted_path.display());
        }
        fs::rename(&extracted_path, &target_path)
            .expect("Failed to move extracted binary");

        // Clean up
        fs::remove_file(&temp_path).ok();
        fs::remove_dir_all(&temp_dir).ok();
    } else {
        // For Windows and Linux, download directly
        let mut file = fs::File::create(&target_path)
            .expect("Failed to create target file");
        let content = response.bytes().expect("Failed to read response body");
        file.write_all(&content)
            .expect("Failed to write downloaded file");
    }

    // Make executable on Unix systems
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&target_path).unwrap().permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&target_path, perms).unwrap();
    }

    println!("cargo:warning=Downloaded and prepared {}", target_path.display());
}
