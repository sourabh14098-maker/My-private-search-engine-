import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function PeopleAlsoAsk({ questions }: { questions: { question: string; answer: string }[] }) { const [open, setOpen] = useState(-1); return <section className="people-ask"><div className="section-kicker"><span>PEOPLE ALSO ASK</span><b /></div>{questions.map((item, index) => <div className="ask-item" key={item.question}><button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}><span>{item.question}</span><ChevronDown size={16} /></button>{open === index && <p>{item.answer} <small>Demo answer</small></p>}</div>)}</section> }
