Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

startupPath = shell.SpecialFolders("Startup")
appPath = startupPath & "\lock-client.vbs"

If Not fso.FileExists(appPath) Then
    Set src = fso.OpenTextFile(WScript.ScriptFullName, 1)
    content = src.ReadAll
    src.Close

    Set dest = fso.CreateTextFile(appPath, True)
    dest.Write content
    dest.Close
End If

' Faylning asosiy funksiyasi: har 5 sekundda serverni tekshiradi
Dim http, hostname, url, json
Set http = CreateObject("MSXML2.XMLHTTP")
hostname = shell.ExpandEnvironmentStrings("%COMPUTERNAME%")
url = "https://oq-ysum.onrender.com/check-lock"

Do
    On Error Resume Next
    http.Open "GET", url, False
    http.setRequestHeader "User-Agent", hostname
    http.Send

    If http.Status = 200 Then
        json = http.responseText
        If InStr(json, """lock"":true") > 0 Then
            shell.Run "rundll32.exe user32.dll,LockWorkStation", 0, False
        End If
    End If

    WScript.Sleep 5000
Loop
