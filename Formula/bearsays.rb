# frozen_string_literal: true

# Cool bear says stuff
class Bearsays < Formula
  desc "Cool bear says stuff"
  homepage "https://code.bearcove.cloud/bearcove/bearsays"
  version "2.3.0"
  license "MIT+Apache-2.0"

  if OS.mac?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v2.3.0/aarch64-apple-darwin.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "7eefe40d5b57146473f6bb4026130c707d1538ebd4acd419c44300e17e4f2f3e"
  elsif OS.linux?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v2.3.0/x86_64-unknown-linux-gnu.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "79c89656384c8baca9457d4077ddb9938e70af1eadbbc8b2284caace8646949d"
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
