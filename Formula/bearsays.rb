# frozen_string_literal: true

# Cool bear says stuff
class Bearsays < Formula
  keg_only "not intended to be linked globally (ships rust libstd and its own modules, no useful lib)"
  desc "Cool bear says stuff"
  homepage "https://code.bearcove.cloud/bearcove/bearsays"
  version "3.0.0"
  license "MIT+Apache-2.0"

  if OS.mac?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v3.0.0/aarch64-apple-darwin.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "b37e55d08e8482329e5adcc47930d153d39aad0d6f8c533c21e8a3ec8baccb4c"
  elsif OS.linux?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v3.0.0/x86_64-unknown-linux-gnu.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "f6e205196c705c5074129df40004581ed08d101643faf62bd6fe6906846eb32d"
  end

  def install
    bin.install "bearsays"
    libexec.install Dir["lib*.dylib"] if OS.mac?
    libexec.install Dir["lib*.so"] if OS.linux?
  end

  test do
    assert_match "#bearsays version #{version}", shell_output("#{bin}/bearsays --version")
  end
end
