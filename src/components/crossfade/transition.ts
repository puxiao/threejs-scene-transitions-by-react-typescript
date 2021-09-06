import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Texture, TextureLoader, WebGLRenderer } from "three";
import FXScene from './FXScene'
import * as Tween from '@tweenjs/tween.js'
import { TransitionParams } from ".";

class Transition {

    public transitionParams: TransitionParams
    public renderer: WebGLRenderer
    public sceneA: FXScene
    public sceneB: FXScene
    public hideNext: boolean = true
    public zoom: boolean = true

    private scene: Scene
    private camera: OrthographicCamera
    private textures: Texture[]
    private material: ShaderMaterial
    private geometry: PlaneGeometry
    private mesh: Mesh
    private needsTextureChange: boolean

    constructor(transitionParams: TransitionParams, renderer: WebGLRenderer, sceneA: FXScene, sceneB: FXScene) {
        this.transitionParams = transitionParams
        this.renderer = renderer
        this.sceneA = sceneA
        this.sceneB = sceneB

        this.scene = new Scene()

        const half_width = window.innerWidth / 2
        const half_height = window.innerHeight / 2

        this.camera = new OrthographicCamera(-half_width, half_width, half_height, -half_height, -10, 10)

        const textureSrc = [
            './textures/transition/transition1.png',
            './textures/transition/transition2.png',
            './textures/transition/transition3.png',
            './textures/transition/transition4.png',
            './textures/transition/transition5.png',
            './textures/transition/transition6.png',
        ]

        this.textures = []
        const textureLoader = new TextureLoader()
        textureSrc.forEach(src => {
            this.textures.push(textureLoader.load(src))
        })

        this.material = new ShaderMaterial({
            uniforms: {
                tDiffuse1: { value: null },
                tDiffuse2: { value: null },
                mixRatio: { value: 0.0 },
                threshold: { value: 0.1 },
                useTexture: { value: 1 },
                tMixTexture: { value: this.textures[0] },
            },
            vertexShader: [
                'varying vec2 vUv;',
                'void main() {',
                'vUv = vec2(uv.x,uv.y);',
                'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform float mixRatio;',
                'uniform sampler2D tDiffuse1;',
                'uniform sampler2D tDiffuse2;',
                'uniform sampler2D tMixTexture;',
                'uniform int useTexture;',
                'uniform float threshold;',
                'varying vec2 vUv;',
                'void main() {',
                'vec4 texel1 = texture2D(tDiffuse1, vUv);',
                'vec4 texel2 = texture2D(tDiffuse2, vUv);',
                'if(useTexture == 1) {',
                'vec4 transitionTexel = texture2D(tMixTexture,vUv);',
                'float r = mixRatio * (1.0 + threshold * 2.0) - threshold;',
                'float mixf = clamp((transitionTexel.r - r) * (1.0/threshold), 0.0, 1.0);',
                'gl_FragColor = mix(texel1, texel2, mixf);',
                '} else {',
                'gl_FragColor = mix(texel2, texel1, mixRatio);',
                '}',
                '}'
            ].join('\n')
        })

        this.geometry = new PlaneGeometry(window.innerWidth, window.innerHeight)
        this.mesh = new Mesh(this.geometry, this.material)
        this.scene.add(this.mesh)

        this.material.uniforms.tDiffuse1.value = this.sceneA.fbo.texture
        this.material.uniforms.tDiffuse2.value = this.sceneB.fbo.texture

        const tween = new Tween.Tween(transitionParams)
        tween.to({ transition: 1 }, 1500)
        tween.repeat(Infinity)
        tween.delay(3000)
        tween.yoyo(true)
        tween.start()

        this.needsTextureChange = false
    }

    public setTextureThreshold = (value: number) => {
        this.material.uniforms.threshold.value = value
    }

    public useTexture = (value: boolean) => {
        this.material.uniforms.useTexture.value = value ? 1 : 0
    }

    public setTexture = (i: number) => {
        this.material.uniforms.tMixTexture.value = this.textures[i]
    }

    public render = (delta: number) => {

        if (this.transitionParams.animate) {
            Tween.update()
            if (this.transitionParams.cycle) {
                if (this.transitionParams.transition === 0 || this.transitionParams.transition === 1) {
                    if (this.needsTextureChange) {
                        let index = this.transitionParams.texture
                        if (index !== undefined) {
                            index = (index + 1) % this.textures.length
                            this.transitionParams.texture = index
                            this.material.uniforms.tMixTexture.value = this.textures[index]
                            this.needsTextureChange = false
                        }
                    }
                } else {
                    this.needsTextureChange = true
                }
            } else {
                this.needsTextureChange = true
            }
        }
        this.material.uniforms.mixRatio.value = this.transitionParams.transition
        if (this.transitionParams.transition === 0) {
            this.hideNext = false
            this.sceneA.zoomInit() //HACK
            this.sceneB.render(delta, false)
        } else if (this.transitionParams.transition === 1) {
            this.hideNext = true
            this.sceneB.zoomInit() //HACK
            this.sceneA.render(delta, false)
        } else {
            if (this.zoom) this.hideNext ? this.sceneA.zoomIn() : this.sceneB.zoomIn()
            this.sceneA.render(delta, true)
            this.sceneB.render(delta, true)
            this.renderer.setRenderTarget(null)
            this.renderer.render(this.scene, this.camera)
        }
    }

    public resize = (width: number, height: number) => {
        const half_width = window.innerWidth / 2
        const half_height = window.innerHeight / 2

        this.mesh.geometry = new PlaneGeometry(width, height)

        this.camera.left = -half_width
        this.camera.right = half_width
        this.camera.top = half_height
        this.camera.bottom = -half_height
        this.camera.updateProjectionMatrix()

        this.sceneA.updateSize(width, height)
        this.sceneB.updateSize(width, height)
        this.renderer.setSize(width, height, false)
    }
}

export default Transition