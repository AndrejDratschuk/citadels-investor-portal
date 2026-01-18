Add-Type -AssemblyName System.IO.Compression.FileSystem
$docxPath = "assets/Email Flow Docs/Lionshare_Stage_01_Emails_Final (1).docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.Entries | Where-Object { $_.Name -eq "document.xml" }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
[xml]$xml = $content
$xml.document.body.InnerText

