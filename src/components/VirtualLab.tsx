import React, { useState, useRef, useEffect } from "react";
import { I } from "./icons";
import { Btn, Card, Field, TIn, TArea, Tag } from "./ui";

/* ================= TERMINAL KALI LINUX - COMPLETO ================= */
export function KaliTerminal({ onCommand }: { onCommand?: (cmd: string, output: string) => void }) {
  const [history, setHistory] = useState<string[]>([
    "┌──(kali㉿cyberacademy)-[~]",
    "└─$ Kali Linux 2024.1 - Educational Environment",
    "└─$ Tools: nmap, metasploit, burpsuite, wireshark, john, hydra, sqlmap, aircrack-ng",
    "└─$ Type 'help' for all available commands",
    ""
  ]);
  const [input, setInput] = useState("");
  const [currentDir, setCurrentDir] = useState("/home/kali");
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    let output: string[] = [];
    const parts = trimmed.split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case "help":
        output = [
          "╔════════════════════════════════════════════════════════════╗",
          "║           KALI LINUX - COMPLETE COMMAND REFERENCE          ║",
          "╚════════════════════════════════════════════════════════════╝",
          "",
          "📁 FILE SYSTEM:",
          "  ls, cd, pwd, mkdir, touch, rm, cp, mv, cat, echo, find, grep",
          "",
          "🌐 NETWORKING:",
          "  ifconfig, ip, ping, traceroute, netstat, ss, dig, nslookup",
          "  nmap, netcat (nc), tcpdump, wireshark, arp, route",
          "",
          "🔐 PASSWORD ATTACKS:",
          "  john (John the Ripper), hydra, hashcat, crunch, maskprocessor",
          "",
          "🕷️ WEB APPLICATION:",
          "  sqlmap, nikto, dirb, gobuster, burpsuite, whatweb, wpscan",
          "",
          "📡 WIRELESS:",
          "  aircrack-ng, reaver, wifite, kismet, mdk3",
          "",
          "💥 EXPLOITATION:",
          "  msfconsole (Metasploit), searchsploit, exploitdb",
          "",
          "🔍 FORENSICS:",
          "  autopsy, binwalk, volatility, foremost, scalpel",
          "",
          "🎭 SOCIAL ENGINEERING:",
          "  setoolkit, social-engineer-toolkit",
          "",
          "⚙️ SYSTEM:",
          "  ps, top, htop, kill, chmod, chown, useradd, passwd, sudo"
        ];
        break;

      case "ls":
        const dir = args[0] || currentDir;
        if (dir === "/home/kali" || dir === "~" || !args[0]) {
          output = ["Documents  Downloads  Desktop  Tools  .bashrc  .ssh  .config"];
        } else if (dir === "Tools") {
          output = ["nmap  metasploit-framework  burpsuite  john  hydra  sqlmap  aircrack-ng"];
        } else {
          output = [`ls: cannot access '${dir}': No such file or directory`];
        }
        break;

      case "cd":
        if (!args[0] || args[0] === "~") {
          setCurrentDir("/home/kali");
          output = [];
        } else if (args[0] === "..") {
          setCurrentDir(currentDir.split("/").slice(0, -1).join("/") || "/");
          output = [];
        } else if (args[0] === "Tools") {
          setCurrentDir(currentDir + "/Tools");
          output = [];
        } else {
          output = [`cd: ${args[0]}: No such file or directory`];
        }
        break;

      case "pwd":
        output = [currentDir];
        break;

      case "whoami":
        output = ["kali"];
        break;

      case "mkdir":
        if (args[0]) {
          output = [`Directory '${args[0]}' created`];
        } else {
          output = ["mkdir: missing operand"];
        }
        break;

      case "touch":
        if (args[0]) {
          output = [`File '${args[0]}' created`];
        } else {
          output = ["touch: missing file operand"];
        }
        break;

      case "cat":
        if (args[0]) {
          if (args[0] === ".bashrc") {
            output = ["# ~/.bashrc: executed by bash(1) for non-login shells", "# Kali Linux default configuration", "export PATH=$PATH:/usr/local/bin"];
          } else {
            output = [`Contents of ${args[0]}: [File content simulation]`];
          }
        } else {
          output = ["cat: missing file operand"];
        }
        break;

      case "grep":
        if (args.length >= 2) {
          output = [`Binary file ${args[1]} matches`, `Found pattern '${args[0]}' in ${args[1]}`];
        } else {
          output = ["Usage: grep [pattern] [file]"];
        }
        break;

      case "find":
        output = [
          "/home/kali/Documents",
          "/home/kali/Documents/report.pdf",
          "/home/kali/Downloads",
          "/home/kali/Desktop"
        ];
        break;

      case "ps":
        output = [
          "  PID TTY          TIME CMD",
          " 1234 pts/0    00:00:00 bash",
          " 1567 pts/0    00:00:01 firefox",
          " 1890 pts/0    00:00:00 nmap",
          " 2123 pts/0    00:00:00 ps"
        ];
        break;

      case "top":
      case "htop":
        output = [
          "top - 14:23:45 up 2:34,  1 user,  load average: 0.52, 0.38, 0.42",
          "Tasks: 142 total,   1 running, 141 sleeping,   0 stopped",
          "%Cpu(s): 12.3 us,  3.4 sy,  0.0 ni, 83.8 id,  0.5 wa",
          "MiB Mem :   7982.4 total,   3456.7 free,   2345.2 used,   2180.5 buff/cache",
          "",
          "  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND",
          " 1567 kali      20   0 2345678 456789  12345 S  12.3   5.7   2:34.56 firefox",
          " 1890 kali      20   0  123456  23456   5678 S   3.4   0.3   0:12.34 nmap"
        ];
        break;

      case "uname":
        if (args[0] === "-a") {
          output = ["Linux cyberacademy 5.15.0-kali3-amd64 #1 SMP Debian 5.15.15-2kali1 x86_64 GNU/Linux"];
        }
        break;

      case "ifconfig":
        output = [
          "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500",
          "        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255",
          "        ether 00:0c:29:3a:4b:5c  txqueuelen 1000  (Ethernet)",
          "        RX packets 1234  bytes 567890 (554.5 KiB)",
          "        TX packets 987  bytes 123456 (120.5 KiB)"
        ];
        break;

      case "ping":
        if (args[0]) {
          output = [
            `PING ${args[0]} (93.184.216.34) 56(84) bytes of data.`,
            "64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=12.3 ms",
            "64 bytes from 93.184.216.34: icmp_seq=2 ttl=56 time=11.8 ms",
            "--- ping statistics ---",
            "2 packets transmitted, 2 received, 0% packet loss"
          ];
        } else {
          output = ["Usage: ping [host]"];
        }
        break;

      case "nmap":
        if (args[0]) {
          const target = args[0];
          const flags = args.slice(1).join(" ");
          output = [
            `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString()}`,
            `Nmap scan report for ${target}`,
            "Host is up (0.012s latency).",
            "Not shown: 993 closed tcp ports (reset)",
            "PORT      STATE SERVICE      VERSION",
            "22/tcp    open  ssh          OpenSSH 8.9p1 Ubuntu 3",
            "80/tcp    open  http         Apache httpd 2.4.52",
            "443/tcp   open  ssl/http     Apache httpd 2.4.52",
            "3306/tcp  open  mysql        MySQL 8.0.32",
            "5432/tcp  open  postgresql   PostgreSQL DB 14.7",
            "6379/tcp  open  redis        Redis key-value store 7.0.8",
            "8080/tcp  open  http-proxy   Squid http proxy 5.7",
            "",
            "Service detection performed. Please report any incorrect results.",
            `Nmap done: 1 IP address (1 host up) scanned in ${(Math.random() * 5 + 2).toFixed(2)} seconds`
          ];
          if (flags.includes("-sV")) {
            output.splice(8, 0, "Service scan executed - versions detected");
          }
          if (flags.includes("-O")) {
            output.splice(9, 0, "OS: Linux 5.15 (96% confidence)");
          }
        } else {
          output = ["Usage: nmap [target] [options]", "Options: -sV (version), -O (OS), -p (ports), -A (aggressive)"];
        }
        break;

      case "netcat":
      case "nc":
        if (args.length >= 2) {
          output = [
            `Connection to ${args[0]} ${args[1]} port [tcp/*] succeeded!`,
            "Connection established",
            "Type 'exit' to close connection"
          ];
        } else {
          output = ["Usage: nc [host] [port]", "Options: -l (listen), -p (port), -v (verbose)"];
        }
        break;

      case "tcpdump":
        output = [
          "tcpdump: verbose output suppressed, use -v or -vv for full protocol decode",
          "listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes",
          "14:23:45.123456 IP 192.168.1.100.45678 > 93.184.216.34.80: Flags [S], seq 1234567890",
          "14:23:45.234567 IP 93.184.216.34.80 > 192.168.1.100.45678: Flags [S.], seq 9876543210",
          "14:23:45.345678 IP 192.168.1.100.45678 > 93.184.216.34.80: Flags [.], ack 1",
          "^C",
          "3 packets captured",
          "6 packets received by filter",
          "0 packets dropped by kernel"
        ];
        break;

      case "sqlmap":
        if (args[0]) {
          output = [
            "        ___",
            "       __H__",
            " ___ ___[.]_____ ___ ___  {1.8.2#stable}",
            "|_ -| . [\"]     | .'| . |",
            "|___|_  [,]_|_|_|__,|  _|",
            "      |_|V...       |_|   https://sqlmap.org",
            "",
            `[!] legal disclaimer: Usage of sqlmap for attacking targets without prior mutual consent is illegal.`,
            "",
            `[${new Date().toLocaleTimeString()}] [INFO] testing connection to the target URL`,
            `[${new Date().toLocaleTimeString()}] [INFO] checking if the target is protected by some kind of WAF/IPS`,
            `[${new Date().toLocaleTimeString()}] [INFO] testing if the target URL content is stable`,
            `[${new Date().toLocaleTimeString()}] [INFO] target URL content is stable`,
            `[${new Date().toLocaleTimeString()}] [INFO] testing if GET parameter 'id' is dynamic`,
            `[${new Date().toLocaleTimeString()}] [INFO] GET parameter 'id' appears to be dynamic`,
            `[${new Date().toLocaleTimeString()}] [WARNING] heuristic (basic) test shows that GET parameter 'id' might be injectable`,
            `[${new Date().toLocaleTimeString()}] [INFO] testing for SQL injection on GET parameter 'id'`,
            "",
            `GET parameter 'id' is vulnerable. Do you want to keep testing the others? [y/N] y`,
            "",
            `sqlmap identified the following injection point(s):`,
            `---`,
            `Parameter: id (GET)`,
            `    Type: boolean-based blind`,
            `    Title: AND boolean-based blind - WHERE or HAVING clause`,
            `    Payload: id=1' AND 1=1--`,
            ``,
            `    Type: time-based blind`,
            `    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)`,
            `    Payload: id=1' AND (SELECT 1 FROM (SELECT(SLEEP(5)))abc)--`,
            ``,
            `    Type: UNION query`,
            `    Payload: id=1' UNION ALL SELECT NULL,NULL,CONCAT(0x716b,...),NULL--`,
            `---`,
            `[${new Date().toLocaleTimeString()}] [INFO] the back-end DBMS is MySQL`,
            `[${new Date().toLocaleTimeString()}] [INFO] fetched data logged to text files under '/home/kali/.local/share/sqlmap/output/'`
          ];
        } else {
          output = ["Usage: sqlmap -u [url]", "Example: sqlmap -u 'http://target.com/page?id=1' --dbs"];
        }
        break;

      case "hydra":
        output = [
          "Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak",
          "",
          "[DATA] max 16 tasks per 1 server, overall 16 tasks",
          "[DATA] attacking ssh://192.168.1.100:22/",
          "[STATUS] 176.00 tries/min, 176 tries in 00:01h",
          "[22][ssh] host: 192.168.1.100   login: admin   password: admin123",
          "[22][ssh] host: 192.168.1.100   login: root   password: password",
          "1 of 1 target successfully completed, 2 valid passwords found",
          "Hydra will now exit"
        ];
        break;

      case "john":
        output = [
          "Created directory: /home/kali/.john",
          "Warning: detected hash type \"md5crypt\", but the string is also recognized as \"md5crypt-long\"",
          "Warning: use \"--format=md5crypt-long\" instead",
          "Loaded 1 password hash (md5crypt, crypt(3) $1$ (and variants) [MD5 32/64])",
          "Will run 4 OpenMP threads",
          "Press 'q' or Ctrl-C to abort, almost any other key for status",
          "password123      (user1)",
          "admin2024        (admin)",
          "2g 0:00:00:05 DONE (2024-01-15 14:23)",
          "2/3 0.38g/s 12345p/s 12345c/s 12345C/s test..password",
          "Use the \"--show\" option to display all of the cracked passwords reliably",
          "Session completed."
        ];
        break;

      case "aircrack-ng":
        output = [
          "Opening capture file",
          "Read 1234567 packets.",
          "",
          "   #  BSSID              ESSID                     Encryption",
          "   1  AA:BB:CC:DD:EE:FF  HomeNetwork               WPA (0 handshake)",
          "   2  11:22:33:44:55:66  OfficeWiFi                WPA2 PSK",
          "",
          "Targeting: 11:22:33:44:55:66 (ESSID: OfficeWiFi)",
          "Running aircrack-ng with wordlist...",
          "",
          "                           [00:05:23] Tested: 123456 keys (got 98765 IVs)",
          "   KB    depth   byte/vote  bit   prob",
          "   123      4/4   0x4B/123   001  95%",
          "   456      3/4   0x7A/456   010  87%",
          "",
          "KEY FOUND! [ password123 ]",
          "Master key     : AA BB CC DD EE FF 00 11 22 33 44 55 66 77 88 99",
          "Decrypted handshake saved to: cracked.cap"
        ];
        break;

      case "msfconsole":
      case "metasploit":
        output = [
          "",
          "       =[ metasploit v6.3.52-dev                              ]",
          "+ -- --=[ 2373 exploits - 1231 auxiliary - 416 post         ]",
          "+ -- --=[ 1388 payloads - 46 encoders - 11 nops             ]",
          "+ -- --=[ 9 evasion                                           ]",
          "",
          "Metasploit tip: View all productivity tips with the tips command",
          "",
          "msf6 > ",
          "Available commands:",
          "  use [exploit]     - Use an exploit",
          "  search [keyword]  - Search for modules",
          "  show exploits     - List all exploits",
          "  back              - Move back from current context",
          "  exit              - Exit Metasploit"
        ];
        break;

      case "nikto":
        if (args[0]) {
          output = [
            `- Nikto v2.5.0`,
            `---------------------------------------------------------------------------`,
            `+ Target IP:          192.168.1.100`,
            `+ Target Hostname:    ${args[0]}`,
            `+ Target Port:        80`,
            `+ Start Time:         ${new Date().toLocaleString()}`,
            `---------------------------------------------------------------------------`,
            `+ Server: Apache/2.4.52 (Ubuntu)`,
            `+ /: The anti-clickjacking X-Frame-Options header is not present.`,
            `+ /: The X-Content-Type-Options header is not set.`,
            `+ /: Server may leak inodes via ETags.`,
            `+ /admin/: Admin login page/section found.`,
            `+ /phpmyadmin/: phpMyAdmin directory found.`,
            `+ /wp-login.php: WordPress login found.`,
            `+ 8734 requests: 0 error(s) and 7 item(s) reported on remote host`,
            `+ End Time:           ${new Date().toLocaleString()} (123 seconds)`,
            `---------------------------------------------------------------------------`,
            `+ 1 host(s) tested`
          ];
        } else {
          output = ["Usage: nikto -h [host]", "Example: nikto -h example.com"];
        }
        break;

      case "burpsuite":
        output = [
          "Starting Burp Suite Community Edition...",
          "",
          "Burp Suite is starting...",
          "Loading extensions...",
          "Starting proxy on 127.0.0.1:8080",
          "",
          "Burp Suite is now running.",
          "Proxy listener: 127.0.0.1:8080",
          "Configure your browser to use this proxy.",
          "",
          "Available modules:",
          "  - Target",
          "  - Proxy",
          "  - Intruder",
          "  - Repeater",
          "  - Sequencer",
          "  - Decoder",
          "  - Comparer",
          "  - Extender",
          "  - Collaborator"
        ];
        break;

      case "wireshark":
        output = [
          "Starting Wireshark...",
          "",
          "Capturing on interface: eth0",
          "",
          "No.     Time           Source                Destination          Protocol Length Info",
          "1       0.000000       192.168.1.100         93.184.216.34        TCP      74     45678 → 80 [SYN]",
          "2       0.012345       93.184.216.34         192.168.1.100        TCP      74     80 → 45678 [SYN, ACK]",
          "3       0.023456       192.168.1.100         93.184.216.34        TCP      66     45678 → 80 [ACK]",
          "4       0.123456       192.168.1.100         93.184.216.34        HTTP     456    GET /index.html",
          "5       0.234567       93.184.216.34         192.168.1.100        HTTP     1234   HTTP/1.1 200 OK",
          "",
          "Capture statistics:",
          "  Packets captured: 12345",
          "  Packets received: 12346",
          "  Packets dropped: 0"
        ];
        break;

      case "searchsploit":
        if (args[0]) {
          output = [
            "----------------------------------------------------------------------------------------",
            " Exploit Title                                                          |  Path",
            "----------------------------------------------------------------------------------------",
            `${args[0]} - Remote Code Execution                                    | exploits/linux/remote/12345.py`,
            `${args[0]} < 2.0 - SQL Injection                                      | exploits/web/remote/23456.txt`,
            `${args[0]} - Cross-Site Scripting                                     | exploits/web/remote/34567.txt`,
            "----------------------------------------------------------------------------------------",
            "Shellcodes: No Results",
            "Papers: No Results"
          ];
        } else {
          output = ["Usage: searchsploit [keyword]", "Example: searchsploit wordpress"];
        }
        break;

      case "setoolkit":
        output = [
          "[*] Social-Engineer Toolkit (SET) v9.0.3",
          "[*] Created by: The Social-Engineer Toolkit (SET) Team",
          "",
          "Select from the menu:",
          "",
          "  1) Social-Engineering Attacks",
          "  2) Fast-Track Penetration Testing",
          "  3) Third Party Modules",
          "  4) Update the Social-Engineer Toolkit",
          "  5) Update SET configuration",
          "  6) Help, Credits, and About",
          "  99) Exit the Social-Engineer Toolkit",
          "",
          "set> "
        ];
        break;

      case "sqlmap":
        if (args[0]) {
          output = [
            "        ___",
            "       __H__",
            " ___ ___[.]_____ ___ ___  {1.6.12#stable}",
            "|_ -| . [)]     | .'| . |",
            "|___|_  [']_|_|_|__,|  _|",
            "      |_|V...       |_|",
            "",
            `[INFO] testing connection to the target URL`,
            `[INFO] testing if the target URL is stable`,
            `[INFO] target URL is stable`,
            `[INFO] testing if GET parameter 'id' is dynamic`,
            `[INFO] GET parameter 'id' appears to be dynamic`,
            `[INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable`,
            `[INFO] testing for SQL injection on GET parameter 'id'`,
            `[INFO] GET parameter 'id' is vulnerable. Do you want to keep testing the others? [y/N]`,
            `sqlmap identified the following injection point(s):`,
            "---",
            `Parameter: id (GET)`,
            `    Type: boolean-based blind`,
            `    Payload: id=1' AND 1=1--`,
            "---",
            `[INFO] the back-end DBMS is MySQL`
          ];
        } else {
          output = ["Usage: sqlmap [url]"];
        }
        break;

      case "hydra":
        output = [
          "Hydra v9.3 (c) 2022 by van Hauser/THC & David Maciejak",
          "",
          "[DATA] max 16 tasks per 1 server, overall 16 tasks",
          "[DATA] attacking ssh://192.168.1.100:22/",
          "[22][ssh] host: 192.168.1.100   login: admin   password: admin123",
          "1 of 1 target successfully completed, 1 valid password found"
        ];
        break;

      case "msfconsole":
        output = [
          "       =[ metasploit v6.2.25-dev                          ]",
          "+ -- --=[ 2250 exploits - 1184 auxiliary - 399 post       ]",
          "+ -- --=[ 617 payloads - 45 encoders - 11 nops            ]",
          "+ -- --=[ 9 evasion                                       ]",
          "",
          "Metasploit tip: Use the analyze command to suggest",
          "runnable modules and options"
        ];
        break;

      case "echo":
        output = [args.join(" ")];
        break;

      case "cat":
        if (args[0]) {
          output = [`Contents of ${args[0]}: This is a sample file content for educational purposes.`];
        } else {
          output = ["Usage: cat [file]"];
        }
        break;

      case "clear":
        setHistory([]);
        return;

      case "exit":
        output = ["Goodbye!"];
        break;

      default:
        output = [`${command}: command not found. Type 'help' for available commands.`];
    }

    const newHistory = [
      ...history,
      `┌──(kali㉿cyberacademy)-[~]`,
      `└─$ ${cmd}`,
      ...output,
      ""
    ];

    setHistory(newHistory);
    if (onCommand) {
      onCommand(cmd, output.join("\n"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(input);
      setInput("");
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-[#1a1a2e] px-4 py-2 flex items-center gap-2 border-b border-line">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="font-mono text-[11px] text-fog ml-2">kali@cyberacademy: ~</span>
      </div>
      <div
        ref={terminalRef}
        className="bg-[#0d0d1a] p-4 font-mono text-[13px] text-[#00ff41] h-[400px] overflow-y-auto"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line.startsWith("┌──") || line.startsWith("└─$") ? (
              <span className="text-[#00bfff]">{line}</span>
            ) : (
              <span>{line}</span>
            )}
          </div>
        ))}
        <div className="flex items-center">
          <span className="text-[#00bfff]">└─$ </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-[#00ff41] ml-1"
            autoFocus
          />
        </div>
      </div>
    </Card>
  );
}

/* ================= SQL PLAYGROUND ================= */
export function SQLPlayground() {
  const [query, setQuery] = useState("SELECT * FROM users;");
  const [result, setResult] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  const executeQuery = () => {
    // Simulated SQL execution
    const q = query.toLowerCase().trim();
    
    if (q.includes("select") && q.includes("users")) {
      setHeaders(["id", "name", "email", "role", "created_at"]);
      setResult([
        ["1", "João Silva", "joao@email.com", "student", "2024-01-15"],
        ["2", "Maria Santos", "maria@email.com", "student", "2024-01-16"],
        ["3", "Pedro Costa", "pedro@email.com", "teacher", "2024-01-10"],
        ["4", "Ana Oliveira", "ana@email.com", "student", "2024-01-17"],
      ]);
    } else if (q.includes("select") && q.includes("courses")) {
      setHeaders(["id", "title", "hours", "level", "price"]);
      setResult([
        ["1", "Full Stack Development", "120", "Intermediate", "1999.00"],
        ["2", "Cybersecurity Fundamentals", "80", "Beginner", "1499.00"],
        ["3", "Data Science with Python", "100", "Intermediate", "1799.00"],
      ]);
    } else {
      setHeaders(["result"]);
      setResult([["Query executed successfully"]]);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-[#1e3a5f] px-4 py-2 flex items-center gap-2 border-b border-line">
        <I n="db" s={16} c="text-cy-300" />
        <span className="font-mono text-[11px] text-cy-200">SQL Playground - PostgreSQL</span>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <Field label="SQL Query">
            <TArea
              rows={6}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="font-mono text-[13px]"
              placeholder="SELECT * FROM users WHERE role = 'student';"
            />
          </Field>
          <Btn v="p" className="mt-3" onClick={executeQuery}>
            <I n="playc" s={14} /> Execute Query
          </Btn>
        </div>

        {result.length > 0 && (
          <div className="overflow-x-auto">
            <div className="font-mono text-[11px] text-fog mb-2">Results ({result.length} rows)</div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-panel border-b border-line">
                  {headers.map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-semibold text-cy-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.map((row, i) => (
                  <tr key={i} className="border-b border-line/30 hover:bg-panel/50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-fog">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ================= CODE PLAYGROUND ================= */
export function CodePlayground({ language = "javascript" }: { language?: string }) {
  const [code, setCode] = useState(
    language === "javascript"
      ? `// JavaScript Example\nconsole.log("Hello, World!");\n\nfunction sum(a, b) {\n  return a + b;\n}\n\nconsole.log(sum(5, 3));`
      : language === "python"
      ? `# Python Example\nprint("Hello, World!")\n\ndef sum(a, b):\n    return a + b\n\nprint(sum(5, 3))`
      : `<!-- HTML Example -->\n<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>`
  );
  const [output, setOutput] = useState("");

  const runCode = () => {
    if (language === "javascript") {
      try {
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.join(" "));
        };
        eval(code);
        console.log = originalLog;
        setOutput(logs.join("\n"));
      } catch (e: any) {
        setOutput(`Error: ${e.message}`);
      }
    } else {
      setOutput(`[${language}] Code execution simulated.\nOutput would appear here in a real environment.`);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-line">
        <div className="flex items-center gap-2">
          <I n="code" s={16} c="text-ember" />
          <span className="font-mono text-[11px] text-ember">{language.toUpperCase()} Playground</span>
        </div>
        <Btn v="p" sm onClick={runCode}>
          <I n="playc" s={12} /> Run
        </Btn>
      </div>
      <div className="grid md:grid-cols-2 gap-0">
        <div className="border-r border-line">
          <div className="bg-[#1e1e1e] p-4">
            <TArea
              rows={15}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-[13px] bg-transparent text-[#d4d4d4]"
              style={{ fontFamily: "'Courier New', monospace" }}
            />
          </div>
        </div>
        <div className="bg-[#1a1a1a] p-4">
          <div className="font-mono text-[11px] text-fog mb-2">Output</div>
          <pre className="font-mono text-[13px] text-[#00ff41] whitespace-pre-wrap min-h-[300px]">
            {output || "Click 'Run' to execute code..."}
          </pre>
        </div>
      </div>
    </Card>
  );
}

/* ================= DOCKER PLAYGROUND ================= */
export function DockerPlayground() {
  const [command, setCommand] = useState("docker ps");
  const [output, setOutput] = useState<string[]>([]);

  const executeCommand = () => {
    const cmd = command.trim().toLowerCase();
    let result: string[] = [];

    if (cmd === "docker ps") {
      result = [
        "CONTAINER ID   IMAGE          COMMAND                  STATUS          PORTS                    NAMES",
        "a1b2c3d4e5f6   nginx:latest   nginx -g 'daemon of...'   Up 2 hours      0.0.0.0:80->80/tcp       web",
        "f6e5d4c3b2a1   postgres:13    docker-entrypoint.s...    Up 2 hours      0.0.0.0:5432->5432/tcp   db",
        "1a2b3c4d5e6f   node:16        docker-node-entrypo...    Up 1 hour       0.0.0.0:3000->3000/tcp   api"
      ];
    } else if (cmd === "docker images") {
      result = [
        "REPOSITORY   TAG       IMAGE ID       CREATED        SIZE",
        "nginx        latest    6efc10a0510f   2 weeks ago    142MB",
        "postgres     13        332c2f0b7f3d   3 weeks ago    315MB",
        "node         16        72d6f47c1a0d   4 weeks ago    994MB"
      ];
    } else if (cmd.startsWith("docker run")) {
      result = ["Container started successfully", "Container ID: " + Math.random().toString(36).substring(7)];
    } else {
      result = ["Unknown command. Try: docker ps, docker images, docker run"];
    }

    setOutput(result);
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-[#0db7ed] px-4 py-2 flex items-center gap-2 border-b border-line">
        <I n="layers" s={16} c="text-ink" />
        <span className="font-mono text-[11px] text-ink font-bold">Docker Playground</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <TIn
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && executeCommand()}
            className="font-mono"
            placeholder="docker ps"
          />
          <Btn v="p" onClick={executeCommand}>
            <I n="playc" s={14} /> Execute
          </Btn>
        </div>
        {output.length > 0 && (
          <div className="bg-[#1a1a1a] p-4 rounded-lg">
            <pre className="font-mono text-[12px] text-[#00ff41] whitespace-pre-wrap">
              {output.join("\n")}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}
