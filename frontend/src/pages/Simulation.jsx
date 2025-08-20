import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
import { Leva } from "leva";
import { Experience } from "../components/Experience";
import { UI } from "../components/UI";

import '../styles.css';

export default function Simulation() {
    return (
        <>
            <Loader />
            <Leva hidden />
            <UI />
            <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
                <Experience />
            </Canvas>
        </>
    );
}
