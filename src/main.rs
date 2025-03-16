fn main() {
    // Get command line arguments
    let args: Vec<String> = std::env::args().collect();

    // Get the message from arguments or use a default
    let message = if args.len() > 1 {
        args[1..].join(" ")
    } else {
        "Hello, I'm a bear!".to_string()
    };

    // Create ASCII art of a bear saying the message
    println!(" ╔══════════════════════╗");
    println!(
        " ║ {}{}║",
        message,
        " ".repeat(std::cmp::max(0, 21 - message.len() as i32) as usize)
    );
    println!(" ╚══════════════════════╝");
    println!("    / ");
    println!("  ʕ•ᴥ•ʔ*");
}
