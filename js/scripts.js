const
colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)')

let theme = 'light'

if (localStorage.getItem('theme')) {
	theme = localStorage.getItem('theme')
	if (theme === 'dark') {
		document.documentElement.classList.add('dark-theme')
	}
}

checkTheme = () => {
	if (!localStorage.getItem('theme')) {
		if (colorSchemeMedia.matches) {
			document.documentElement.classList.add('dark-theme')
			theme = 'dark'
		}
		else if (document.documentElement.classList.contains('dark-theme')) {
			document.documentElement.classList.remove('dark-theme')
			theme = 'light'
		}
		localStorage.setItem('theme', theme)
	}
}

checkTheme()
colorSchemeMedia.addEventListener('change', checkTheme)

const
MDCTopAppBar = mdc.topAppBar.MDCTopAppBar,
MDCFormField = mdc.formField.MDCFormField,
MDCCheckbox = mdc.checkbox.MDCCheckbox,
MDCRadio = mdc.radio.MDCRadio,
MDCSwitch = mdc.switchControl.MDCSwitch

const
topAppBar = new MDCTopAppBar(document.querySelector('.mdc-top-app-bar')),
mainElement = document.querySelector('main'),
formFieldElements = document.querySelectorAll('.mdc-form-field'),
switchElements = document.querySelectorAll('.mdc-switch')

//	

Ripple.attach(['mdc-button', 'mdc-fab'])
Ripple.attach(['mdc-icon-button', 'mdc-checkbox', 'mdc-radio', 'mdc-switch__ripple'], {'centered': true})
Ripple.initialize({'debug': true})

topAppBar.setScrollTarget(document.querySelector('main'))

document.querySelectorAll('a').forEach(el => {
	//	Disable dragging of link elements.
	el.setAttribute('draggable', false)
})

formFieldElements.forEach(formField => {
	let tempFormField = new MDCFormField(formField)
	formField.querySelectorAll('.mdc-checkbox').forEach(checkbox => {
		let tempCheckbox = new MDCCheckbox(checkbox)
		tempFormField.input = tempCheckbox
	})
	formField.querySelectorAll('.mdc-radio').forEach(radio => {
		let tempRadio = new MDCRadio(radio)
		tempFormField.input = tempRadio
	})
})

switchElements.forEach(switchElement => {
	let tempSwitch = new MDCSwitch(switchElement)
})

//	Button links

document.querySelectorAll('[data-button]').forEach(button => {
	//	Replace href with data-button-link
	button.setAttribute('data-button-link', button.getAttribute('href'))
	button.removeAttribute('href')

	//	Left click
	button.addEventListener('click', () => {
		window.open(button.dataset.buttonLink, '_self')
	})
	//	Middle click (Open in new tab)
	button.addEventListener('auxclick', (e) => {
		if (e.button === 1) {
			window.open(button.dataset.buttonLink, '_blank')
		}
	})
})

//	Theme button

const
themeButton = document.querySelector('#theme'),
themeButtonIcon = themeButton.querySelector('.mdc-button__icon')
setThemeIcon = () => {
	themeButtonIcon.innerText = `${theme}_mode`
	if (theme === 'dark') {
		themeButton.classList.add('dark')
		document.documentElement.classList.add('dark-theme')
	}
	else {
		document.documentElement.classList.remove('dark-theme')
	}
}
setThemeIcon()

themeButton.addEventListener('click', () => {
	if (themeButton.classList.contains('dark')) {
		themeButton.classList.remove('dark')
		themeButtonIcon.style.transform = null
		theme = 'light'
	}
	else {
		themeButton.classList.add('dark')
		themeButtonIcon.style.transform = 'rotate(360deg)'
		theme = 'dark'
	}
	setTimeout(() => {
		setThemeIcon()
	},Number(window.getComputedStyle(themeButtonIcon).transitionDuration.replace('s','')) * 1000 / 2)
	localStorage.setItem('theme', theme)
})

//	Prism.js

Prism.plugins.customClass.add(({content, language}) => {
	if ((content === 'var' || content == 'let' || content === 'const') && language === 'js') {
		return 'variable'
	}
	else if (content === '=>' && language === 'js') {
		return 'arrow-function'
	}
})