class Bearsays < Formula
  desc "A fun CLI tool that makes bears say things"
  homepage "https://code.bearcove.cloud/bearcove/bearsays"
  version "1.5.0"
  license "MIT"

  if OS.mac?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v1.5.0/aarch64-apple-darwin.tar.xz"
    sha256 "4bfdc4333ea812fa47df15cc65456f7c43619dc840a2e2f963731c79add3d67c"
  elsif OS.linux?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v1.5.0/x86_64-unknown-linux-gnu.tar.xz"
    sha256 "4bfdc4333ea812fa47df15cc65456f7c43619dc840a2e2f963731c79add3d67c"
  end

  def install
    bin.install "bearsays"
  end

  test do
    assert_match "BearSays version #{version}", shell_output("#{bin}/bearsays --version")
  end
end