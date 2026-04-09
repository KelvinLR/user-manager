import { useEffect, useRef, useState } from "react"
import { Stage, Layer, Rect } from "react-konva"
import * as faceapi from "face-api.js"


function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [faces, setFaces] = useState<any[]>([])
  const [videoReady, setVideoReady] = useState(false)

  const [fps, setFps] = useState(0)
  const [detectionTime, setDetectionTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)

  const fpsRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const runningRef = useRef(false)

  // useEffects -> gerenciam coisas fora do contexto da UI
  // iniciar câmera
  useEffect(() => {
    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    }

    startCamera()
  }, [])

  // carregar modelo
  useEffect(() => {
    async function loadModels() {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
      console.log("modelo carregado")
    }

    loadModels()
  }, [])

  // loop de detecção de rostos
  useEffect(() => {
    async function detect() {
      if (!videoRef.current || !videoReady) {
        requestAnimationFrame(detect)
        return
      }

      const start = performance.now()

      try {
        const result = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )

        const afterDetection = performance.now()

        const mapped = result.map(det => det.box)
        setFaces(mapped)

        requestAnimationFrame(() => {
          const end = performance.now()

          setDetectionTime(afterDetection - start)
          setTotalTime(end - start)
        })

      } catch (err) {
        console.error("erro detecção:", err)
      }

      requestAnimationFrame(detect)
    }

    detect()
  }, [videoReady])

  useEffect(() => {
    if (runningRef.current) return
    runningRef.current = true

    function monitorFPS() {
      const now = performance.now()
      fpsRef.current++

      if (now - lastTimeRef.current >= 1000) {
        setFps(fpsRef.current)
        fpsRef.current = 0
        lastTimeRef.current = now
      }

      requestAnimationFrame(monitorFPS)
    }

    monitorFPS()
  }, [])

  return (
    <body>
      <h1>Webcam View</h1>
      <div style={{ position: "relative", width: 640, height: 480, margin: "0 auto" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={640}
        height={480}
        onLoadedMetadata={() => {
          console.log("video pronto")
          setVideoReady(true)
        }}
        style={{ position: "absolute", top: 0, left: 0 }}
      />

      <Stage
        width={640}
        height={480}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Layer>
          {faces.map((face, i) => (
            <Rect
              key={i}
              x={face.x}
              y={face.y}
              width={face.width}
              height={face.height}
              stroke="red"
              strokeWidth={2}
            />
          ))}
        </Layer>
      </Stage>
    </div>
    <p>FPS: {fps}</p>    <p>Detecção: {detectionTime.toFixed(1)} ms</p>
    <p>Total: {totalTime.toFixed(1)} ms</p>
    </body>
    
  )
}

export default App