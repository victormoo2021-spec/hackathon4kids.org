import CodeTyper from './CodeTyper'
import TurtleCanvas from './TurtleCanvas'
import { PROGRAM, RUN } from './program'

// Code-built space-black laptop. Sized entirely in cqw so it scales without CLS.
export default function Device({ progress }: { progress: number }) {
  return (
    <div className="device-wrap">
      <div className="device-in">
        <div className="device" aria-hidden>
          <div className="lid">
            <div className="bezel">
              <div className="screen">
                <div className="notch"><i /></div>
                <div className="win">
                  <div className="bar">
                    <span className="file">spiral.py</span>
                    <span className="run-btn">Run</span>
                  </div>
                  <div className="panes">
                    <div className="editor"><CodeTyper /></div>
                    <div className="out"><TurtleCanvas progress={progress} /></div>
                  </div>
                  <p className="term"><span>$</span> <em>{RUN.output.join('  ')}</em></p>
                </div>
              </div>
            </div>
          </div>
          <div className="base"><span /></div>
        </div>
        <div className="sr-only">
          <p>A laptop showing spiral.py, a short Python program:</p>
          <pre>{PROGRAM}</pre>
          <p>When it runs, it draws a {RUN.segments.length}-line triangular spiral in yellow and purple and prints: {RUN.output[0]}</p>
        </div>
      </div>
    </div>
  )
}
