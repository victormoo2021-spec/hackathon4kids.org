import { runTurtle } from './turtle'

// The program shown in the editor is the program that runs and draws.
export const PROGRAM = `# A spiral that draws itself
import turtle
t = turtle.Turtle()
t.pensize(2)
for i in range(36):
    t.pencolor("#ffd60a")
    t.forward(10 + i * 5)
    t.left(121)
    t.pencolor("#a78bff")
    t.forward(10 + i * 5)
    t.left(121)
print("Done! 72 lines drawn.")`

export const RUN = runTurtle(PROGRAM)
