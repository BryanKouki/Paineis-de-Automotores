@echo off
rem Compila o launcher com o compilador que ja vem no Windows 10/11 (nao precisa instalar nada).
rem Os .winmd dao acesso ao controle de midia do Windows (o que esta tocando no computador).
cd /d "%~dp0.."
set META=%WINDIR%\System32\WinMetadata
"%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /codepage:65001 /target:winexe /win32icon:launcher\icone.ico ^
  /r:System.Windows.Forms.dll /r:System.Runtime.dll /r:System.Runtime.InteropServices.WindowsRuntime.dll ^
  /r:"%META%\Windows.Foundation.winmd" /r:"%META%\Windows.Media.winmd" /r:"%META%\Windows.Storage.winmd" ^
  /out:"Paineis de Automotores.exe" launcher\Launcher.cs
