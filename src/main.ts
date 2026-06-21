import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root not found')
}

app.innerHTML = `
  <main class="page">
    <section class="card">
      <p class="eyebrow">Gb Staff Performance</p>
      <h1>New Vite + TypeScript Project</h1>
      <p class="copy">Your workspace is scaffolded and ready for feature development.</p>
      <button id="countBtn" type="button">Count is 0</button>
    </section>
  </main>
`

const countButton = document.querySelector<HTMLButtonElement>('#countBtn')

if (!countButton) {
  throw new Error('Counter button not found')
}

let count = 0
countButton.addEventListener('click', () => {
  count += 1
  countButton.textContent = `Count is ${count}`
})
