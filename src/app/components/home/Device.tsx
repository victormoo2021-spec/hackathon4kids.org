import CodeTyper from './CodeTyper'
import TurtleCanvas from './TurtleCanvas'
import { RUN } from './program'

// Code-built dark laptop. Sized entirely in cqw so it scales without CLS.
export default function Device({ progress }: { progress: number }) {
  return (
    <div className="device-wrap">
      <div className="device-in">
        <div className="glow" aria-hidden />
        <div className="device" role="img" aria-label="A laptop running a short Python program that draws a spiral">
          <div className="lid">
            <div className="bezel">
              <div className="screen">
                <div className="win">
                  <div className="bar">
                    <i /><i /><i />
                    <span className="file">spiral.py</span>
                    <span className="run-btn">Run</span>
                  </div>
                  <div className="panes">
                    <div className="editor"><CodeTyper /></div>
                    <div className="out"><TurtleCanvas progress={progress} /></div>
                  </div>
                  <p className="term"><span>$</span> {RUN.output.join('  ')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="base"><span /></div>
        </div>
      </div>
    </div>
  )
}
