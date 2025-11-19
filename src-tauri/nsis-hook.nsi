; NSIS Hook to register custom file icon for .rne files
!macro NSIS_HOOK_POSTINSTALL
  ; Register the .rne file extension
  WriteRegStr HKCR ".rne" "" "RhythmNator.Project"
  WriteRegStr HKCR "RhythmNator.Project" "" "RhythmNator Project"
  WriteRegStr HKCR "RhythmNator.Project\DefaultIcon" "" "$INSTDIR\icons\rne-file.ico,0"
  
  ; Set the application to open .rne files
  WriteRegStr HKCR "RhythmNator.Project\shell\open\command" "" '"$INSTDIR\RhythmNator Editor.exe" "%1"'
  
  ; Notify Windows of the file association change
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; Unregister the .rne file extension
  DeleteRegKey HKCR ".rne"
  DeleteRegKey HKCR "RhythmNator.Project"
  
  ; Notify Windows of the file association change
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend
