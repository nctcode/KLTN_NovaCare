import os

# Test syntax of sitemap diagram
puml = """@startwbs
<style>
wbsDiagram {
  BackgroundColor #FFFFFF
  LineColor #000000
  FontName Arial
  FontSize 12
  FontColor #000000
  RoundCorner 0
  node {
    BackgroundColor #87CEEB
    LineColor #000000
    FontColor #000000
  }
}
</style>
* NovaCare
** Web
*** Public
*** Patient
*** Hospital Admin
*** Super Admin
** Mobile
*** Home
*** Booking
*** Telemedicine
@endwbs
"""

print("WBS string length:", len(puml))

