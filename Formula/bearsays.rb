# frozen_string_literal: true

# Cool bear says stuff
class Bearsays < Formula
  keg_only "not intended to be linked globally (ships rust libstd and its own modules, no useful lib)"
  desc "Cool bear says stuff"
  homepage "https://code.bearcove.cloud/bearcove/bearsays"
  version "2.3.3"
  license "MIT+Apache-2.0"

  if OS.mac?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v2.3.3/aarch64-apple-darwin.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "e2a20e75ca83c301349ab09dcc7cb7ec5a694d055c9d00db9066ea9ec3ff248b"
  elsif OS.linux?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v2.3.3/x86_64-unknown-linux-gnu.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "9c52620c95665e91427376bc0f0560464631ab08a7fd9a75487aa1894464946a"
  end

  def install
    bin.install "bearsays"
    lib.install Dir["lib*.dylib"] if OS.mac?
    lib.install Dir["lib*.so"] if OS.linux?
  end

  test do
    assert_match "#bearsays version #{version}", shell_output("#{bin}/bearsays --version")
  end
end
