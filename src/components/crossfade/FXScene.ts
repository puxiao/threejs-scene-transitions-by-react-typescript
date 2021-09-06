import { AmbientLight, BufferGeometry, Color, InstancedMesh, LinearFilter, Material, MeshPhongMaterial, Object3D, PerspectiveCamera, RGBFormat, Scene, SpotLight, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three'

const generateInstancedMesh = (geometry: BufferGeometry, material: Material, count: number): InstancedMesh => {
    const mesh = new InstancedMesh(geometry, material, count)
    const dummy = new Object3D()
    const color = new Color()
    for (let i = 0; i < count; i++) {
        dummy.position.set(
            Math.random() * 10000 - 5000,
            Math.random() * 6000 - 3000,
            Math.random() * 8000 - 4000
        )
        dummy.rotation.set(
            Math.random() * 2 * Math.PI,
            Math.random() * 2 * Math.PI,
            Math.random() * 2 * Math.PI
        )
        if (geometry.type === 'BoxGeometry') {
            dummy.scale.set(
                Math.random() * 200 + 100,
                Math.random() * 200 + 100,
                Math.random() * 200 + 100,
            )
        } else {
            const scale = Math.random() * 200 + 100
            dummy.scale.set(scale, scale, scale)
        }
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        mesh.setColorAt(i, color.setScalar(0.1 + 0.9 * Math.random()))
    }

    return mesh
}

class FXScene {
    public renderer: WebGLRenderer
    public geometry: BufferGeometry
    public rotationSpeed: Vector3
    public clearColor: number

    private scene: Scene
    private camera: PerspectiveCamera
    private light: SpotLight

    private material: MeshPhongMaterial
    private mesh: InstancedMesh

    public fbo: WebGLRenderTarget

    constructor(renderer: WebGLRenderer, geometry: BufferGeometry, rotationSpeed: Vector3, clearColor: number) {
        this.renderer = renderer
        this.geometry = geometry
        this.rotationSpeed = rotationSpeed
        this.clearColor = clearColor

        this.scene = new Scene()
        this.scene.add(new AmbientLight(0x555555))

        this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000)
        this.camera.position.z = 2000

        this.light = new SpotLight(0xffffff, 1.5)
        this.light.position.set(0, 500, 2000)
        this.scene.add(this.light)

        const color = geometry.type === 'BoxGeometry' ? 0x0000ff : 0xff0000
        this.material = new MeshPhongMaterial({
            color,
            flatShading: true
        })

        this.mesh = generateInstancedMesh(geometry, this.material, 100)
        this.scene.add(this.mesh)

        const renderTargetParameters = {
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            format: RGBFormat
        }
        this.fbo = new WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            renderTargetParameters
        )
    }

    public render = (delta: number, rtt: boolean) => {
        this.mesh.rotation.x += this.rotationSpeed.x * delta
        this.mesh.rotation.y += this.rotationSpeed.y * delta
        this.mesh.rotation.z += this.rotationSpeed.z * delta

        //this.camera.position.z -= 80 * delta

        this.renderer.setClearColor(this.clearColor)

        if (rtt) {

            this.renderer.setRenderTarget(this.fbo)
            this.renderer.clear()
        } else {

            this.renderer.setRenderTarget(null)
        }

        this.renderer.render(this.scene, this.camera)
    }

    public zoomIn = () => {
        this.camera.position.z -= 50
    }

    public zoomInit = () => {
        this.camera.position.z = 2000
    }

    public updateSize(width: number, height: number) {
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.fbo.setSize(width, height)
    }
}

export default FXScene