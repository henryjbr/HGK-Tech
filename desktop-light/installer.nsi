Unicode true
!include "MUI2.nsh"

!ifndef STAGE_DIR
  !error "STAGE_DIR nao definido"
!endif
!ifndef OUTPUT_FILE
  !error "OUTPUT_FILE nao definido"
!endif

Name "HGK Dashboard"
OutFile "${OUTPUT_FILE}"
InstallDir "$LOCALAPPDATA\Programs\HGK Dashboard"
InstallDirRegKey HKCU "Software\HGK Tech\HGK Dashboard" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma

!define MUI_ABORTWARNING
!define MUI_ICON "..\desktop\icon.ico"
!define MUI_UNICON "..\desktop\icon.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\HGK Dashboard.exe"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "PortugueseBR"

Section "Instalar"
  SetOutPath "$INSTDIR"
  File /r "${STAGE_DIR}\*"

  CreateDirectory "$SMPROGRAMS\HGK Tech"
  CreateShortcut "$DESKTOP\HGK Dashboard.lnk" "$INSTDIR\HGK Dashboard.exe"
  CreateShortcut "$SMPROGRAMS\HGK Tech\HGK Dashboard.lnk" "$INSTDIR\HGK Dashboard.exe"

  WriteUninstaller "$INSTDIR\Desinstalar.exe"
  WriteRegStr HKCU "Software\HGK Tech\HGK Dashboard" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HGK Dashboard" "DisplayName" "HGK Dashboard"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HGK Dashboard" "DisplayVersion" "1.0.2"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HGK Dashboard" "Publisher" "HGK Tech"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HGK Dashboard" "UninstallString" '"$INSTDIR\Desinstalar.exe"'
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HGK Dashboard" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HGK Dashboard" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\HGK Dashboard.lnk"
  Delete "$SMPROGRAMS\HGK Tech\HGK Dashboard.lnk"
  RMDir "$SMPROGRAMS\HGK Tech"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HGK Dashboard"
  DeleteRegKey HKCU "Software\HGK Tech\HGK Dashboard"
SectionEnd
