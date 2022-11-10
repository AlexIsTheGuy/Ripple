/**
 * Ripple v0.1.0
 * 
 * JavaScript ripple click effect library inspired by Material Design.
 * https://github.com/AlexIsTheGuy/Ripple
 * 
 * Copyright © 2022 Aleksandar Blažić
 * Released under the MIT License
 * https://github.com/AlexIsTheGuy/Ripple/blob/main/LICENSE
 */

{
	const
	/**
	 *	Default config/options
	 *	
	 *	These are the options that will be used if the user calls
	 *	`Ripple.initialize()` without any parameters.
	 */
	defaultOptions = {
		'debug': false,
		'ripple': {
			'duration': 225,
			'delay': 200,
			'disabledAttribute': true,
			'disabled': false,
			'centered': false,
			'copyBorderRadius': true,
			'helperClass': true,
			'container': '.ripple-container',
			'target': false
		}
	},

	//	Functions

	/**
	 *	Generates a random string of characters.
	 *	
	 *	@param {Number} [len=16] Length of the random string the function returns.
	 *	@returns {String} Random string.
	 */
	genRandomID = (len=16) => {
		charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
		let randomString = ''
		for (let i=0;i<len;i++) {
			let randomPos = Math.floor(Math.random() * charSet.length)
			randomString += charSet.substring(randomPos,randomPos+1)
		}
		return randomString
	},

	/**
	 *	Returns the distance from point A (x1,y1) to point B (x2,y2).
	 *	
	 *	@param {Number} x1 X coordinate of point A.
	 *	@param {Number} y1 Y coordinate of point A.
	 *	@param {Number} x2 X coordinate of point B.
	 *	@param {Number} y2 Y coordinate of point B.
	 *	@returns {Number} Distance from point A to point B.
	 */
	getDistance = (x1, y1, x2, y2) => {
		let
		x = x2 - x1,
		y = y2 - y1
		
		return Math.sqrt(x * x + y * y)
	},

	/**
	 *	Makes an async function wait a specified amount of time.
	 *	
	 *	@param {Number} ms 
	 */
	sleep = ms => new Promise(r => setTimeout(r, ms)),

	/**
	 *	@param {String} _classname Classname to attach.
	 *	@param {{}} [_options={}] Custom trigger options.
	 *	@throws {TypeError} If `_classname` is not a String. 
	 */
	attachClass = (_classname, _options={}) => {
		if (typeof _classname !== 'string') {
			throw new TypeError('_classname is not a string.')
		}
		if (_classname[0] === '.') {
			_classname = _classname.substring(1)
		}

		window.Ripple.triggerClasses[_classname] = {
			'ripple': {..._options}
		}
	},

	/**
	 *	@param {Array<HTMLElement>} _elements Array of HTMLElements to attach.
	 *	@param {{}} [_options={}] Custom trigger options.
	 *	@throws {TypeError} If `_elements` is not an Array. 
	 */
	attachElements = (_elements, _options={}) => {
		if (!(Array.isArray(_elements))) {
			throw new TypeError('_elements is not an Array.')
		}

		window.Ripple.triggerElements[genRandomID()] = {
			'ripple': {..._options},
			'elements': _elements
		}
	},

	/**
	 *	@param {String} _class Classname to detach.
	 */
	detachClass = (_class) => {
		if (_class[0] === '.') {
			_class = _class.substring(1)
		}

		delete Ripple.triggerClasses[_class]
	},

	/**
	 *	@param {HTMLElement} _element HTMLElement to detach.
	 */
	detachElement = (_element) => {
		let valueID = Object.keys(Ripple.triggerElements).find(key => Ripple.triggerElements[key]['elements'].includes(_element))

		if (!valueID) {
			return false
		}

		Ripple.triggerElements[valueID]['elements'] = Ripple.triggerElements[valueID]['elements'].filter((value) => {
			return value !== _element
		})

		if (Ripple.triggerElements[valueID]['elements'].length === 0) {
			delete Ripple.triggerElements[valueID]
		}
	}

	/**
	 *	@param {{}} [options={}] Custom global options.
	 */
	class RippleEffect {
		constructor(options={}) {
			//	Copy the default options.
			this.options = {...defaultOptions}
			Object.keys(options).forEach(option => {
				//	Replace the corresponding default value.
				this.options[option] = options[option]
			})
			
			this.touchEnd = false
			//	List of ripple elements in the DOM.
			this.activeRipples = {}

			//	If `this.options['debug']` is true:
			if (this.options['debug']) {
				//	Add this class (RippleEffect) to `Ripple.effect`.
				Ripple.effect = this
			}
		}
		passArguments = (e) => {
			//	If the event is a 'mousedown' event and the function was
			//	triggered at least 5ms before this event was:
			if (this.touchEnd && e.type === 'mousedown') {
				//	Stop executing the function.
				return false
			}

			//	If the event is a 'mousedown' event and the right mouse
			//	button was used to trigger the event:
			if (e.type === 'mousedown' && e.button === 2) {
				//	Stop executing the function.
				return false
			}

			let
			/**
			 *	An HTML Element that triggered a ripple effect.
			 *	@type {HTMLElement}
			 */
			trigger,
			/**
			 *	An array of HTML Elements that are the targets for ripple effects.
			 *	@type {Array<HTMLElement>}
			 */
			targets,
			/**
			 *	An Object containing the custom options for ripple effects.
			 *	@type {{}}
			 */
			tempOptions

			//	Check if there is an element that should trigger a ripple effect
			//	in the document tree.
			e.composedPath().forEach(el => {
				//	If the current item in the document tree is not
				//	an HTML element (usually `window` and `document`):
				if (!(el instanceof HTMLElement)) {
					//	Stop executing the function.
					return false
				}
				//	If there is an element that has the [data-ripple-trigger-for] attribute:
				if (el.dataset.rippleTriggerFor) {
					//	Set the current element as the trigger element.
					trigger = el
					//	Set an array of elements that have a [data-ripple-target] attribute
					//	and match the trigger elements' [data-ripple-trigger-for] attribute
					//	as the target elements.
					targets = document.querySelectorAll(`[data-ripple-target='${trigger.dataset.rippleTriggerFor}']`)
					
					//	Set the target elements options
					//
					//!	Since the elements have been found in the DOM there is no easy
					//!	way to give them custom options except with custom classnames!
					//! Because of this, the options will be inherited from
					//!	`options['ripple']`!
					tempOptions = {...this.options['ripple']}
				}
				//	If no trigger and targets were found:
				else if (!trigger && !targets) {
					//	Check if any of the `Ripple.triggerClasses` object
					//	keys match the current element's classlist:
					Object.keys(Ripple.triggerClasses).forEach(className => {
						if (el.classList.contains(className)) {
							//	Set the current element as the trigger element.
							trigger = el
							//	Set the current element as the target element.
							targets = [el]

							//	Set the target elements options
							tempOptions = {...Ripple.triggerClasses[className]['ripple']}
						}
					})
				}
				//	If no trigger and targets were found:
				if (!trigger && !targets) {
					//	Try to find a random ID using the current element by matching
					//	it against every element in `Ripple.triggerElements`.
					let valueID = Object.keys(Ripple.triggerElements).find(key => Ripple.triggerElements[key]['elements'].includes(el))

					//	If a valid random ID has not been found:
					if (!valueID) {
						//	Stop executing the function.
						return false
					}

					//	Check if any of the `Ripple.triggerElements` object
					//	values 'elements' key array contains the current element:
					if (Ripple.triggerElements[valueID]['elements'].includes(el)) {
						//	Set the current element as the trigger element.
						trigger = el
						//	Set the current element as the target element.
						targets = [el]

						//	Set the target elements options
						tempOptions = {...Ripple.triggerElements[valueID]['ripple']}
					}
				}
			})
			
			//	If a trigger and targets were found:
			if (trigger && targets) {
				//	Copy `this.options['ripple']`
				let options = {...this.options['ripple']}

				Object.keys(options).forEach(option => {
					//	If `option` is defined:
					if (tempOptions[option] !== undefined) {
						//	Replace the corresponding default value from tempOptions.
						options[option] = tempOptions[option]
					}
				})

				//	If options['target'] is not false:
				if (options['target'] !== false) {
					//	If options['target'] is a String (Classname):
					if (typeof options['target'] === 'string' && options['target'].length > 0) {
						if (options['target'][0] === '.') {
							options['target'] = options['target'].substring(1)
						}
						//if ()
						targets = document.querySelectorAll(`.${options['target']}`)
					}
					//	If options['target'] is an HTMLElement:
					else if (options['target'] instanceof HTMLElement) {
						targets = [options['target']]
					}
					//	If options['target'] is an Array:
					else if (options['target'].isArray()) {
						console.log('array')
					}
				}

				let rippleContainer,ev,relX,relY

				if (e.type === 'touchstart') {
					//	If the event was a 'touchstart' event, wait for `options.delay`ms
					//	before starting the effect to prevent the effect from happening when
					//	the user intends to scroll the page.
					this.touchDelay = options['delay']
					//	React only to the last touch in the targetTouches array.
					ev = e.targetTouches[e.targetTouches.length-1]
				}
				else {
					//	Don't wait if the event was not a TouchEvent.
					this.touchDelay = 0
					ev = e
				}
				targets.forEach(target => {
					//	If `options['disabled']` is true or the trigger element
					//	or the target element has 'ripple-disabled' classname:
					if (options['disabled'] || trigger.classList.contains('ripple-disabled') || target.classList.contains('ripple-disabled')) {
						//	Stop executing the function.
						return false
					}
					//	If `options['disabledAttribute']` is true and
					//	the trigger element or the target element is disabled:
					if (options['disabledAttribute'] && (trigger.disabled || target.disabled)) {
						//	Stop executing the function.
						return false
					}
					//	If the target element has 'ripple-centered' classname or
					//	`options['centered'] is true:
					if (target.classList.contains('ripple-centered') || options['centered']) {
						//	Set the relative ripple's center position to the
						//	center of the target element.
						relX = target.clientWidth/2
						relY = target.clientHeight/2
					}
					else {
						//	Set the relative ripple's center position to the
						//	relative position of the click/touch.
						relX = ev.clientX - Math.round(trigger.getBoundingClientRect().x),
						relY = ev.clientY - Math.round(trigger.getBoundingClientRect().y)
					}

					//	If the target element has [data-ripple-container-class] attribute:
					if (target.dataset.rippleContainerClass) {
						//	If the first character is a dot:
						if (target.dataset.rippleContainerClass[0] === '.') {
							//	Remove the first character.
							target.dataset.rippleContainerClass = target.dataset.rippleContainerClass.substring(1)
						}
						//	Set the first element inside the target that matches the
						//	classname inside [data-ripple-container-class] attribute as
						//	the container for the ripple elements.
						rippleContainer = target.querySelector(`.${target.dataset.rippleContainerClass}`)
					}
					//	If `options['container']` is a String and it's not empty:
					else if (typeof options['container'] === 'string' && options['container'].length > 0 && options['container'] !== '.') {
						//	If the first character is a dot:
						if (options['container'][0] === '.') {
							//	Remove the first character (dot).
							options['container'] = options['container'].substring(1)
						}

						//	Check if element is a direct child.
						let isDirectChild = false
						if (target.querySelector(`.${options['container']}`)) {
							[...target.querySelector(`.${options['container']}`).children].forEach(el => {
								if (el === target.querySelector(`.${options['container']}`)) {
									isDirectChild = true
								}
							})
						}
						//	If an element that matches the classname inside
						//	`options['container']` exists in the target element
						//	and it is its direct child element:
						if (target.querySelector(`.${options['container']}`) && isDirectChild) {
							//	Set the first element inside the target that matches
							//	the classname inside `options['container']` as the
							//	container for ripple elements.
							rippleContainer = target.querySelector(`.${options['container']}`)
						}
						else {
							//	Create the element if no match was found.
							rippleContainer = document.createElement('div')
							rippleContainer.classList.add(options['container'])

							//	If `options['copyBorderRadius']` is true or the target
							//	element contains the classname 'ripple-copy-radius':
							if (options['copyBorderRadius'] || target.classList.contains('ripple-copy-radius')) {
								//	Copy the border radius from the target element.
								rippleContainer.style.borderRadius = window.getComputedStyle(target).borderRadius
							}
						}
					}
					else {
						//	Set the target element as the container for ripple elements
						//	if `options.container` is false.
						//	
						//!	If `options.helperClass` is false and the target
						//!	element's CSS position is 'static', the ripple elements
						//!	will not be positioned correctly!
						rippleContainer = target
					}

					//	If `options['helperClass']` is true and the trigger element
					//	or the target element don't have 'ripple-no-helper-class' classname:
					if (options['helperClass'] && !(trigger.classList.contains('ripple-no-helper-class') || target.classList.contains('ripple-no-helper-class'))) {
						//	Add `ripple-helper-class' classname to the target element.
						target.classList.add('ripple-helper-class')
					}

					//	Call the next function.
					//	(Create the ripple element and add it to the DOM.)
					this.addRipple(relX, relY, target, rippleContainer, options)
				})
			}
		}
		addRipple = (x, y, target, rippleContainer, options={...this.options['ripple']}) => {
			//	Shorthand
			if (x === 'c') {
				x = target.clientWidth/2
			}
			if (y === 'c') {
				y = target.clientHeight/2
			}

			let
			x2 = 0,
			y2 = 0,
			randomID = genRandomID()

			if ((x <= target.clientWidth/2 && y <= target.clientHeight/2) || (x > target.clientWidth/2 && y <= target.clientHeight/2)) {
				y2 = target.clientHeight
			}
			if ((x <= target.clientWidth/2 && y <= target.clientHeight/2) || (x <= target.clientWidth/2 && y > target.clientHeight/2)) {
				x2 = target.clientWidth
			}

			let
			/**
			 *	The size of the ripple element will always be 2 times the distance
			 *	from the click/touch position to the farthest corner of the target element.
			 *	This means that the ripple element will always cover the entire
			 *	target element and `options.duration` will be exactly the time it takes
			 *	for the ripple element to cover the whole target element.
			 */
			rippleSize = getDistance(x,y,x2,y2),
			ripple = document.createElement('div')

			ripple.classList.add('ripple-element')
			//	Prevent any transitions for the following CSS properties.
			ripple.style.transitionDuration = '0ms'
			ripple.style.left = `${-rippleSize + x}px`
			ripple.style.top = `${-rippleSize + y}px`
			ripple.style.width = `${rippleSize * 2}px`
			ripple.style.height = `${rippleSize * 2}px`
			ripple.style.transitionDuration = `${options['duration']}ms`

			ripple.dataset.rippleCreated = Date.now()
			ripple.dataset.rippleId = randomID

			rippleContainer.appendChild(ripple)

			if (!document.contains(rippleContainer)) {
				target.appendChild(rippleContainer)
			}

			//	Add the ripple element, it's target element and the options
			//	to the list of ripple elements in the DOM for future reference.
			this.activeRipples[randomID] = {
				'target': target, 
				'ripple': ripple,
				'options': options,
				'touchMoved': false
			}

			//	Call the next function.
			//	(Show the ripple element.)
			this.showRipple(target, ripple)

			//	Return the ripple that was just created for reference with other functions.
			return ripple
		}
		showRipple = async (target, ripple) => {
			let touchEnd = false,
			options = this.activeRipples[ripple.dataset.rippleId]['options'],
			touchMoved = this.activeRipples[ripple.dataset.rippleId]['touchMoved']

			/**
			 *	A function whose purpose is to pass parameters to another
			 *	function when used with addEventListener() instead of using
			 *	an anonymous function which doesn't allow removal of the
			 *	event listener.
			 */
			const hideRippleParams = (e) => {
				//	If the targets don't match:
				if (!e.composedPath().includes(target)) {
					//	Stop executing the function.
					return false
				}
				//	Call the next function.
				//	(Hide the ripple element.)
				this.hideRipple(target, ripple, e.type)
			},
			/**
			 *	A function for use with addEventListener() which can be used
			 *	to remove the event listener afterwards.
			 */	
			touchMove = () => {
				touchMoved = true
			},
			/**
			 *	A function for use with addEventListener() which can be used
			 *	to remove the event listener afterwards.
			 *	
			 *	This function will be called when the user stops touching
			 *	the screen with their finger.
			 */	
			touchEndRipple = async (e) => {
				//	If the targets don't match:
				if (!e.composedPath().includes(target)) {
					//	Stop executing the function.
					return false
				}
				//	If the user moved their finger:
				if (touchMoved) {
					//	Call the next function.
					//	(Remove the ripple element from the DOM immediately.)
					this.removeRipple(ripple, false)
					return false
				}
				touchEnd = true

				//	Show the ripple element.
				setTimeout(() => {
					ripple.style.opacity = 1
					ripple.style.transform = 'scale(1) translateZ(0)'
				},10)

				//	Wait for the transition to finish.
				await sleep(options['duration'])

				//	Hide the ripple element.
				ripple.style.opacity = null

				//	Call the next function.
				//	(Remove the ripple element from the DOM.)
				this.removeRipple(ripple)
			}

			//	Store the `hideRippleParams()` function in the list of ripple elements
			//	in the DOM for future reference.
			this.activeRipples[ripple.dataset.rippleId]['hideRippleFunction'] = hideRippleParams

			//	Add event listeners responsible for removing the ripple
			//	element before waiting for the touch delay time.
			document.body.addEventListener('touchmove', touchMove)
			document.body.addEventListener('touchend', touchEndRipple)
			document.body.addEventListener('touchcancel', touchEndRipple)

			//	Wait for `this.touchDelay`ms. Remove the ripple element
			//	if the user moves their finger on the screen or stops touching
			//	the target element before `this.touchDelay`ms time has passed.
			await sleep(this.touchDelay)

			//	Remove event listeners that aren't needed anymore.
			document.body.removeEventListener('touchmove', touchMove)
			document.body.removeEventListener('touchend', touchEndRipple)
			document.body.removeEventListener('touchcancel', touchEndRipple)

			//	If the user didn't stop touching the target element, moved their
			//	finger across the screen and the target element still contains the ripple
			//	element which is hidden before `this.touchDelay`ms time has passed:
			if (touchEnd === false && touchMoved === false && ripple.style.opacity !== 1 && target.contains(ripple)) {
				//	Show the ripple element.
				ripple.style.opacity = 1
				ripple.style.transform = 'scale(1) translateZ(0)'

				//	Add event listeners responsible for hiding the ripple element
				//	when the user moves their finger across the screen, stops touching
				//	the screen with their finger or mouse, the touch event gets cancelled
				//	for some reason or their mouse leaves the target element.
				document.body.addEventListener('touchmove', hideRippleParams)
				document.body.addEventListener('touchend', hideRippleParams)
				document.body.addEventListener('touchcancel', hideRippleParams)
				document.body.addEventListener('mouseup', hideRippleParams)
				target.addEventListener('mouseleave', hideRippleParams)
			}
			else {
				//	Return the variable to it's default state.
				touchMoved = false
			}
		}
		hideRipple = async (target, ripple, eventType) => {
			//	If the ripple effect doesn't exist anymore:
			if (!this.activeRipples[ripple.dataset.rippleId]) {
				//	Stop executing the function.
				return false
			}

			//	Retreive the `hideRippleParams()` function from the list of
			//	ripple elements in the DOM so the event listeners that call
			//	this function could be removed. (This is the future reference)
			const hideRippleParams = this.activeRipples[ripple.dataset.rippleId]['hideRippleFunction']
			let options = this.activeRipples[ripple.dataset.rippleId]['options']

			//	Remove event listeners that aren't needed anymore.
			document.body.removeEventListener('touchmove', hideRippleParams)
			document.body.removeEventListener('touchend', hideRippleParams)
			document.body.removeEventListener('mouseup', hideRippleParams)
			target.removeEventListener('mouseleave', hideRippleParams)

			const currentTime = Date.now(),
			createdTime = Number(ripple.dataset.rippleCreated)
			
			//	The default time to be added to the sleep function
			//	which will be called later.
			let timeModifier = 0

			//	If the ripple effect has not finished its transition (touch delay included):
			if (currentTime - createdTime - this.touchDelay) {
				//	If `eventType` variable was passed to this function and the
				//	`eventType` is 'touchmove' or 'mouseleave':
				if (eventType && (eventType === 'touchmove' || eventType === 'mouseleave')) {
					//	Set the time to be added to the sleep function
					//	which will be called later to 150(ms).
					timeModifier = 150
				}
				//	Wait for the time it takes for the ripple transition to finish completely.
				//	Includes the touch delay and the time modifier.
				await sleep((options['duration'] - (currentTime - createdTime - this.touchDelay)) + timeModifier)
			}

			//	Hide the ripple element.
			ripple.style.opacity = null

			//	Call the next function.
			//	(Remove the ripple element from the DOM.)
			this.removeRipple(ripple)
		}
		removeRipple = async (ripple, delay=true) => {
			//	Set options.duration to 0 to skip waiting time if it doesn't
			//	get overwritten if the ripple effect doesn't exist anymore.
			let options = {duration:0}
			//	If the ripple effect still exists:
			if (this.activeRipples[ripple.dataset.rippleId]) {
				//	Overwrite initial options value.
				options = this.activeRipples[ripple.dataset.rippleId]['options']
			}
			if (delay) {
				//	Wait for the time it takes for the ripple to hide itself.
				await sleep(options['duration'])
			}
			try {
				//	Remove the ripple element.
				ripple.remove()
				//	Delete the ripple element from the list of ripple elements
				//	in the DOM.
				delete this.activeRipples[ripple.dataset.rippleId]
			}
			catch (error) {
				//	If the ripple doesn't exist and the `ripple.remove()` function
				//	returns an error for some reason, display an error message in
				//	the console instead of (possibly) breaking stuff.
				console.error(error)
			}
		}
		/**
		 *	A function for use with addEventListener() which can be used
		 *	to remove the event listener afterwards.
		 *	
		 *	This function is responsible for preventing a 'mousedown' event
		 *	from happening right after a 'touchend' event.
		 */
		touchEndTimer = () => {
			this.touchEnd = true
			setTimeout(() => {
				this.touchEnd = false
			},5)
		}
	}

	//	Ripple

	let rippleEffect

	window.Ripple = {
		'triggerClasses': {},
		'triggerElements': {}
	}

	/**
	 *	Adds event listeners to document body that listen for
	 *	events and removes them if they already exists to prevent
	 *	creating multiple ripple effects on a single click.
	 *	
	 *	@param {{
	 *		debug?: Boolean,
	 *		ripple?: {
	 *			duration?: Number,
	 *			delay?: Number,
	 *			disabledAttribute?: Boolean,
	 *			disabled?: Boolean,
	 *			centered?: Boolean,
	 *			copyBorderRadius?: Boolean,
	 *			helperClass?: Boolean,
	 *			container?: String | false,
	 *			target?: String | HTMLElement | Array<String | HTMLElement> | false
	 *		}
	 *	}} [options] Custom global options.
	 */
	Ripple.initialize = (options) => {
		Ripple.deinitialize()
		rippleEffect = new RippleEffect(options)
		document.body.addEventListener('touchstart', rippleEffect.passArguments)
		document.body.addEventListener('touchend', rippleEffect.touchEndTimer)
		document.body.addEventListener('mousedown', rippleEffect.passArguments)
	}

	/**
	 *	Removes the event listeners from document body that are
	 *	responsible for creating ripple effects.
	 */
	Ripple.deinitialize = () => {
		if (rippleEffect) {
			document.body.removeEventListener('touchstart', rippleEffect.passArguments)
			document.body.removeEventListener('touchend', rippleEffect.touchEndTimer)
			document.body.removeEventListener('mousedown', rippleEffect.passArguments)
		}
	}

	/**
	 *	Adds a String (classname) to `Ripple.triggerClasses`, an HTMLElement
	 *	to `Ripple.triggerElements` or an Array of Strings and/or HTMLElements
	 *	to a corresponding Ripple property which will allow the ripple effect
	 *	to be created and sets the custom trigger options.
	 *	
	 *	@param {string | Array<HTMLElement | String> | HTMLElement} elements 
	 *	@param {{
	 *		debug?: Boolean,
	 *		ripple?: {
	 *			duration?: Number,
	 *			delay?: Number,
	 *			disabledAttribute?: Boolean,
	 *			disabled?: Boolean,
	 *			centered?: Boolean,
	 *			copyBorderRadius?: Boolean,
	 *			helperClass?: Boolean,
	 *			container?: String | false,
	 *			target?: String | HTMLElement | Array<String | HTMLElement> | false
	 *		}
	 *	}} [options] Custom global options.
	 *	@throws {ReferenceError} If `elements` is not defined.
	 *	@throws {TypeError} If `elements` is not a String, HTMLElement or Array.
	 */
	Ripple.attach = (elements, options={}) => {
		if (!elements) {
			throw ReferenceError('elements must be defined.')
		}

		if (elements instanceof HTMLElement) {
			elements = [elements]
		}

		if (typeof elements === 'string') {
			elements.split(',').forEach(_className => {
				attachClass(_className, options)
			})
		}
		else if (Array.isArray(elements)) {
			let _elements = []

			//	Flatten the array
			elements = elements.flat(16)
			
			elements.forEach(_arrayItem => {
				//	If `_arrayItem` is a string: (it probably means
				//	that it is a classname.)
				if (typeof _arrayItem === 'string') {
					//	Call next function.
					//	(Create a new classname trigger.)
					attachClass(_arrayItem, options)
				}
				else if (_arrayItem instanceof HTMLElement) {
					//	Add to `_elements` array.
					_elements.push(_arrayItem)
				}
			})

			//	Call the next function.
			//	(Create a new elements trigger.)
			if (_elements.length > 0) {
				attachElements(_elements, options)
			}
		}
		else {
			throw TypeError('elements must be a String, HTMLElement or Array.')
		}
	}

	/**
	 *	Removes a classname from Ripple.triggerClasses or an element
	 *	or array of elements from Ripple.triggerElements which will prevent
	 *	the creation of ripple effects on the element.
	 *	
	 *	@param {String | Array | HTMLElement} elements 
	 */
	Ripple.detach = (elements) => {
		if (typeof elements === 'string') {
			elements.split(',').forEach(_class => {
				detachClass(_class)
			})
		}
		else {
			if (elements instanceof HTMLElement) {
				elements = [elements]
			}
			Array.from(elements).flat().forEach(_element => {
				detachElement(_element)
			})
		}
	}

	//	Add 'ripple-effect' classname to `Ripple.triggerClasses`.
	Ripple.attach('.ripple-effect')
}