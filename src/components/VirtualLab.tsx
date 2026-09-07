import React, { useState, useRef, useEffect } from "react";
import { I } from "./icons";
import { Btn, Card, Field, TIn, TArea, Tag } from "./ui";

/* ================= TERMINAL KALI LINUX ================= */
export function KaliTerminal({ onCommand }: { onCommand?: (cmd: string, output: string) => void }) {
  const [history, setHistory] = useState<string[]>([
    "┌──(kali㉿cyberacademy)-[~]",
    "└─$ Welcome to Kali Linux Educational Terminal",
    "Type 'help' for available commands",
    ""
  ]);
  const [input, setInput] = useState("");
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
          "Available commands:",
          "  ls [dir]          - List directory contents",
          "  cd [dir]          - Change directory",
          "  pwd               - Print working directory",
          "  cat [file]        - Display file contents",
          "  echo [text]       - Display text",
          "  whoami            - Display current user",
          "  uname -a          - System information",
          "  ifconfig          - Network configuration",
          "  ping [host]       - Ping host",
          "  nmap [target]     - Network scanner",
          "  sqlmap [url]      - SQL injection tool",
          "  hydra             - Password cracker",
          "  john              - John the Ripper",
          "  msfconsole        - Metasploit Framework",
          "  clear             - Clear terminal",
          "  exit              - Exit terminal"
        ];
        break;

      case "ls":
        output = ["Documents  Downloads  Desktop  .bashrc  .ssh"];
        break;

      case "pwd":
        output = ["/home/kali"];
        break;

      case "whoami":
        output = ["kali"];
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
          output = [
            `Starting Nmap 7.92 ( https://nmap.org )`,
            `Nmap scan report for ${args[0]}`,
            "Host is up (0.012s latency).",
            "Not shown: 995 closed ports",
            "PORT     STATE SERVICE",
            "22/tcp   open  ssh",
            "80/tcp   open  http",
            "443/tcp  open  https",
            "3306/tcp open  mysql",
            "8080/tcp open  http-proxy",
            "",
            "Nmap done: 1 IP address (1 host up) scanned in 2.34 seconds"
          ];
        } else {
          output = ["Usage: nmap [target]"];
        }
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
