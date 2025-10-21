use std::fs;
use std::path::Path;
use std::process::Command;

fn main() {
    // Download cloudflared binaries for different platforms
    download_cloudflared_binaries();

    tauri_build::build()
}

fn download_cloudflared_binaries() {
    let bin_dir = Path::new("../bin");
    fs::create_dir_all(&bin_dir).expect("Failed to create bin directory");

    // Determine the current target platform and download the appropriate binary
    let (download_name, is_tgz, _binary_name) = if cfg!(target_os = "windows") {
        ("cloudflared-windows-amd64.exe", false, "cloudflared.exe")
    } else if cfg!(target_os = "macos") {
        ("cloudflared-darwin-amd64.tgz", true, "cloudflared")
    } else if cfg!(target_os = "linux") {
        ("cloudflared-linux-amd64", false, "cloudflared")
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

    // Download the file
    if is_tgz {
        let temp_path = bin_dir.join("temp.tgz");
        let status = Command::new("curl")
            .args(["-L", "-o", &temp_path.to_string_lossy(), &url])
            .status()
            .expect("Failed to download cloudflared binary");

        if !status.success() {
            panic!("Failed to download {}", download_name);
        }

        // Extract the tar.gz
        let temp_dir = bin_dir.join("temp");
        fs::create_dir_all(&temp_dir).expect("Failed to create temp directory");

        let status = Command::new("tar")
            .args(["-xzf", &temp_path.to_string_lossy(), "-C", &temp_dir.to_string_lossy()])
            .status()
            .expect("Failed to extract tar.gz");

        if !status.success() {
            panic!("Failed to extract {}", download_name);
        }

        // Move the extracted binary
        let extracted_path = temp_dir.join("cloudflared");
        fs::rename(&extracted_path, &target_path).expect("Failed to move extracted binary");

        // Clean up
        fs::remove_file(&temp_path).ok();
        fs::remove_dir_all(&temp_dir).ok();
    } else {
        let status = Command::new("curl")
            .args(["-L", "-o", &target_path.to_string_lossy(), &url])
            .status()
            .expect("Failed to download cloudflared binary");

        if !status.success() {
            panic!("Failed to download {}", download_name);
        }
    };

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
