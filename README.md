## Lion City Soundscapes Dataset Visualisation
### NTU Final Year Project 2026/27
This is a copy of the web application that visualises characteristic soundscapes of Singapore on an interactive Leaflet map done by the previous graduating batch, Abigale Tan Xian Pei. This is used as an supplement to my result findings as part of my Final Year Project (FYP) requirement at NTU. This data includes pre-existing data from 'Lion City Soundscapes'. This repository comprises of the code used to develop the web application. The web application has been deployed on GitHub Pages and can be viewed live at https://itskuroh.github.io/LCS_Visualisation/.

#### Building & Deployment 
- Ensure that "Source" is "deployed from "branch"
- "Branch" is "main"

#### Database management 
##### Locations.csv
- For "type" column, "-" maps to gray location marker
- Only to update "vidEmbed" links

#### Style.css

<details>
  <summary>Update Location Marker Style</summary>

  ```css
  /* Boring & Lifeless: Black */
  .pin-bl { background-color: #0f0e16; } 

  /* Calm & Tranquil: Green */
  .pin-ct { background-color: #76a162; } 

  /* Full of Life & Exciting: Orange */
  .pin-fe { background-color: #e68f37; } 

  /* Chaotic & Restless: Pink */
  .pin-cr { background-color: #c94370; } 

  /* "-" Type: Grey */
  .pin-dash { background-color: #9E9E9E; }
```
</details>

<details>
  <summary>Update legend styling</summary>

  ```css
  /* Sound Pressure Level (SPL) Gradient */
  .grad-spl { 
      background: linear-gradient(to right, #32CD32, #FFEA00, #FF8C00, #FF0000); 
  }

  /* ISO PL Gradient */
  .grad-isopl { 
      background: linear-gradient(to right, #25f396, #009cfb, #0074ff, #3300ff, #A020F0); 
  }

  /* ISO EV Gradient */
  .grad-isoev { 
      background: linear-gradient(to right, #6D1DC6, #9B04DB, #E200A3, #FF1C6A, #FF8103, #FBDD49); 
  }

  /* Loudness Metric */
  .grad-loudness { 
      background: linear-gradient(to right, #0074ff, #32CD32, #FFEA00, #FF8C00, #FF0000); 
  }

  /* Sharpness Metric */
  .grad-sharpness { 
      background: linear-gradient(to right, #009cfb, #3415cc, #591597, #8d1e5b, #de3324); 
  }

  /* Roughness Metric */
  .grad-roughness { 
      background: linear-gradient(to right, #607d8b, #2c948e, #97a607, #ff8c00); 
  }

```
</details>

#### Map-logic.js

<details>
  <summary>Update Heatmap styling on map view</summary>

  ```javascript
  function getSPLColor(spl) {
      if (isNaN(spl)) return null;
      if (spl >= 71) return 'rgba(255, 0, 0, 0.6)';      // #FF0000 (Red)
      if (spl >= 61) return 'rgba(255, 140, 0, 0.6)';    // #FF8C00 (Orange)
      if (spl >= 51) return 'rgba(255, 234, 0, 0.5)';    // #FFEA00 (Yellow)
      return 'rgba(50, 205, 50, 0.5)';                   // #32CD32 (Green)
  }

