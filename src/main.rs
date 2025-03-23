fn main() {
    // Get command line arguments
    let args: Vec<String> = std::env::args().collect();

    // Get the message from arguments or use a default
    let message = if args.len() > 1 {
        args[1..].join(" ")
    } else {
        "IAMA bear, AMA kthx".to_string()
    };

    // Create ASCII art of a bear saying the message
    println!(" ╔══════════════════════╗");
    let max_width = 21;
    let words: Vec<&str> = message.split_whitespace().collect();
    let mut current_line = String::new();
    for word in words {
        if current_line.len() + word.len() + 1 > max_width {
            println!(
                " ║ {}{}║",
                current_line,
                " ".repeat(max_width - current_line.len())
            );
            current_line.clear();
        }
        if !current_line.is_empty() {
            current_line.push(' ');
        }
        current_line.push_str(word);
    }
    if !current_line.is_empty() {
        println!(
            " ║ {}{}║",
            current_line,
            " ".repeat(max_width - current_line.len())
        );
    }
    println!(" ╚══════════════════════╝");
    println!("    / ");
    println!("  ʕ•ᴥ•ʔ*");
}
