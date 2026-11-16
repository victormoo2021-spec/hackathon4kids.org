import CodeTyper from './CodeTyper'
import GameScene from './GameScene'

// Code-built laptop. Sized entirely in cqw so it scales without CLS.
export default function Device() {
  return (
    <div className="device-wrap">
      <div className="device-in">
        <div className="glow" aria-hidden />
        <div className="device" role="img" aria-label="A laptop showing a short Python program that moves a robot to a star">
          <div className="lid">
            <div className="bezel">
              <div className="screen">
                <div className="editor">
                  <div className="bar">
                    <i /><i /><i />
                    <span className="file">robot.py</span>
                    <span className="run-btn">▶ Run</span>
                  </div>
                  <CodeTyper />
                </div>
                <div className="game-layer"><GameScene /></div>
              </div>
            </div>
          </div>
          <div className="base"><span /></div>
        </div>
      </div>
    </div>
  )
}
