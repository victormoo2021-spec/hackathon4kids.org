/*
  Team roster for /about#instructors.

  To swap the roster: replace the entries in `team`. Order here is display order. Set
  `hidden: true` to keep someone in the file without showing them.
  Privacy: for high-school instructors use first name + grade only; no school names; no photos on the site.
  `courses` must use names from content/courses.ts (add a new course there first).
*/

import type { Course } from '../content/courses'
export type { Course }

export type Person = {
  name: string
  role: string
  grade: string // as of the bio text: grade or school stage, no school names
  bio: string
  current: boolean // current team vs. former/retired
  tags: Course[]
  hidden?: boolean
}

export const team: Person[] = [
  {
    name: 'Johnny',
    grade: 'Senior',
    role: 'Co-President, Instructor',
    current: true,
    tags: ['Robotics'],
    bio: 'Johnny is a high school senior who likes programming, robotics, and football. He has 2 years of programming experience and 3 years of robotics experience. Johnny is currently the programming mentor for 2 middle school robotics teams and seeks to pass on his programming knowledge.',
  },
  {
    name: 'Kartik',
    grade: 'Senior',
    role: 'Co-President, Instructor',
    current: true,
    tags: ['AP CSA'],
    bio: 'Kartik is a high school senior. He is interested in Coding, Math and Soccer. In his free time, he enjoys hiking and spending time with his family. He also enjoys playing soccer with his friends. Being with friends is something he always prefers which helps balance his high school academic life.',
  },
  {
    name: 'Victor',
    grade: 'Junior',
    role: 'Vice President, Instructor',
    current: true,
    tags: ['Intro to Algebra'],
    bio: 'Victor is a high school junior. He enjoys taekwondo and robotics, and has been coding since 6th grade. He has worked with Java, JavaScript, Python and C++.',
  },
  {
    name: 'Chris',
    grade: 'Graduate',
    role: 'Former Leadership',
    current: false,
    tags: ['AMC 10', 'AP Physics 1'],
    bio: 'Chris is a high school graduate. He is interested in a variety of STEM related topics such as mathematics, reading, science, and especially astronomy. He enjoys witnessing the wonders of the natural world and outer space. Chris is also one who is always willing to help out others or the community. During his free time, he likes to hang out with his friends or exercise.',
  },
  {
    name: 'Eric',
    grade: 'Graduate',
    role: 'Former Leadership',
    current: false,
    tags: ['AP CSA'],
    bio: "Eric is a high school graduate. He is interested in scripting, modeling, and graphic design. In his free time, Eric enjoys hiking, gaming, photography, and pondering life's big questions. Eric finds solace and inspiration in the great outdoors. Hiking through nature's scenic trails allows him to escape the hustle and bustle of everyday life, connecting him with the serenity and beauty of the natural world.",
  },
  {
    name: 'Michael',
    grade: 'College',
    role: 'Advisor',
    current: true,
    tags: ['Git + GitHub', 'AP CSA'],
    bio: 'Michael is a second-year at UCLA majoring in computer science and minoring in philosophy. His research interests include functional programming, programming language design, and compilers. He also love software engineering and has 2+ years of experience in full-stack software development and DevOps.',
  },
  {
    name: 'Egan',
    grade: 'College',
    role: 'Advisor',
    current: false,
    tags: ['AMC 8'],
    bio: "Egan is a first-year in UT Austin's honors engineering program. He enjoys writing in his spare time, but also takes pleasure in debate. Egan teaches AMC math but has extensive background in other subjects as well such as Java and science.",
    hidden: true,
  },
  {
    name: 'Ben',
    grade: 'College',
    role: 'Former Leadership',
    current: false,
    tags: ['Game Development'],
    bio: "Ben is a first-year at UCLA studying computer science and linguistics. He enjoys developing web apps and games, and has been learning programming for 4+ years. He's experienced in Javascript, Python, C#, and Java. In his free time he like playing badminton and experimenting with things on his computer like digital art, music production, photo manipulation, Android development, along with many other things.",
  },
  {
    name: 'Rohan',
    grade: 'College',
    role: 'Advisor',
    current: false,
    tags: ['AP CSA'],
    bio: 'Rohan is a second-year at UC Berkeley. His passions include computer science, physics, machine learning, and sustainability. He enjoys engaging in research and staying involved in his community either through service or education. He has taught a variety of topics from pure math to robot automation. As a teacher, his primary goal is to play a role in helping someone discover their own spark or passion.',
  },
  {
    name: 'Sri',
    grade: 'College',
    role: 'Co-Founder',
    current: false,
    tags: ['AP CSA', 'Python'],
    bio: 'Sri is a third-year at UC Berkeley studying computer science. He enjoys math, computer science, cricket and basketball. He has taken multiple computer science courses at local community colleges and is highly proficient in Java, HTML, CSS and Python. Sri takes pleasure in giving back to his community and his parent’s home country.',
  },
  {
    name: 'Ojus',
    grade: 'College',
    role: 'Co-Founder',
    current: false,
    tags: ['AP CSA'],
    bio: 'Ojus is a third-year at UC Berkeley studying computer science. He is a STEM-oriented student who has passions in computer science, math, and finance. Ojus loves to give back to his community and help underprivileged kids around the world.',
  },
]
