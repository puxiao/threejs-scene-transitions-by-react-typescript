import { Fragment, useEffect, useRef, useState } from "react"
import * as Three from 'three'
import { BoxGeometry, IcosahedronBufferGeometry, Vector3, WebGLRenderer } from "three"
import FXScene from "./FXScene"
import Transition from "./transition"
import './index.scss'
import DatGui, { DatBoolean } from "react-dat-gui"
import 'react-dat-gui/dist/dist/index.css'

export interface TransitionParams {
    'useTexture'?: boolean,
    'transition'?: number,
    'texture'?: number,
    'cycle'?: boolean,
    'animate'?: boolean,
    'threshold'?: number
}

let transitionParams: TransitionParams = {
    'useTexture': true,
    'transition': 0,
    'texture': 5,
    'cycle': true,
    'animate': true,
    'threshold': 0.3
}

interface GuiData {
    'texture': boolean,
    'zoom': boolean,
}

const Crossfade = () => {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [guiData, setGuiData] = useState<GuiData>({ texture: true, zoom: true })
    const transitionRef = useRef<Transition | null>(null)

    const handleGuiUpdate = (data: Partial<GuiData>) => {
        setGuiData({ ...guiData, ...data })
    }

    useEffect(() => {
        if (canvasRef.current === null) return

        const clock = new Three.Clock()

        const renderer = new WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true
        })

        const geometryA = new BoxGeometry(2, 2, 2)
        const geometryB = new IcosahedronBufferGeometry(1, 1)
        const sceneA = new FXScene(renderer, geometryA, new Vector3(0, -0.4, 0), 0xffffff)
        const sceneB = new FXScene(renderer, geometryB, new Vector3(0, 0.2, 0.1), 0x000000)

        const transition = new Transition(transitionParams, renderer, sceneA, sceneB)
        transitionRef.current = transition

        const render = () => {
            transition.render(clock.getDelta())
        }

        const animate = () => {
            render()
            requestAnimationFrame(animate)
        }
        animate()

        const handleResize = () => {
            if (canvasRef.current === null) return
            const width = canvasRef.current.clientWidth
            const height = canvasRef.current.clientHeight
            transition.resize(width, height)
        }
        handleResize()
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }

    }, [])

    useEffect(() => {
        if (transitionRef.current === null) return

        transitionRef.current.useTexture(guiData.texture)
        transitionRef.current.zoom = guiData.zoom

    }, [guiData, transitionRef])

    return (
        <Fragment>
            <div id="info">
                <a href="https://threejs.org" target='blank' rel="noopener">three.js</a> webgl scene transitions<br />
                by <a href="https://twitter.com/fernandojsg" target='blank' rel="noopener">fernandojsg</a> - <a
                    href="https://github.com/kile/three.js-demos" target='blank' rel="noopener">github</a><br />
                <a href="https://github.com/puxiao/threejs-scene-transitions-by-react-typescript" target='blank' rel="noopener">https://github.com/puxiao/threejs-scene-transitions-by-react-typescript</a>
            </div>
            <DatGui data={guiData} onUpdate={handleGuiUpdate} className='dat-gui'>
                <DatBoolean path='texture' label='Texture' />
                <DatBoolean path='zoom' label='Zoom' />
            </DatGui>
            <canvas ref={canvasRef} className='full-screen' />
        </Fragment>
    )
}

export default Crossfade