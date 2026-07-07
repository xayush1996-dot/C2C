use rand::Rng;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    // Default action is generating OTP
    let mut action = "generate_otp";
    if args.len() > 1 {
        action = &args[1];
    }

    match action {
        "generate_otp" => {
            let mut rng = rand::thread_rng();
            let code: u32 = rng.gen_range(100_000..1_000_000);
            println!("{}", code);
        }
        "verify_signature" => {
            // Simulated Rust security signature validation
            println!("SIGNATURE_VALID");
        }
        _ => {
            eprintln!("Unknown action: {}", action);
            std::process::exit(1);
        }
    }
}
