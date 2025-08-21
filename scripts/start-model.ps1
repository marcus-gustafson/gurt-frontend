param(
  [string]$ModelPath = "C:\models\your.gguf",
  [int]$Port = 8080
)
# Bind to loopback ONLY
.\llama-server.exe --host 127.0.0.1 --port $Port --model $ModelPath
