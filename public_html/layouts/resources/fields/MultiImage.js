/* {[The file is published on the basis of YetiForce Public License 3.0 that can be found in the following directory: licenses/LicenseEN.txt or yetiforce.com]} */

class MultiImage {

	/**
	 * Create class instance
	 * @param {HTMLElement|jQuery} inputElement - input type file element inside component
	 */
	constructor(inputElement) {
		const thisInstance = this;
		this.files = [];
		this.component = $(inputElement).closest('.js-multi-image').eq(0);
		this.addButton = $(this.component).find('.js-multi-image__file-btn').eq(0);
		this.fileInput = $(inputElement).detach();
		this.addButton.click(this.addButtonClick.bind(this));
		this.valuesInput = $(this.component).find('.js-multi-image__values').eq(0);
		this.progressBar = $(this.component).find('.js-multi-image__progress-bar').eq(0);
		this.progress = $(this.component.find('.js-multi-image__progress')).eq(0);
		this.result = this.component.find('.js-multi-image__result').eq(0);
		this.fileInput.fileupload({
			dataType: 'json',
			replaceFileInput: false,
			fileInput: this.fileInput,
			autoUpload: false,
			acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
			submit: thisInstance.submit.bind(thisInstance),
			add: thisInstance.add.bind(thisInstance),
			progressall: thisInstance.progressAll.bind(thisInstance),
			change: thisInstance.change.bind(thisInstance),
			drop: thisInstance.change.bind(thisInstance),
		});
		this.fileInput.fileupload('option', 'dropZone', $(this.component));
		this.component.on('click', '.js-multi-image__popover-img', function (e) {
			thisInstance.zoomPreview($(this).data('hash'));
		});
		this.component.on('click', '.js-multi-image__popover-btn-zoom', function (e) {
			thisInstance.zoomPreview($(this).data('hash'));
		});
		this.component.on('dblclick', '.js-multi-image__preview-img', function (e) {
			thisInstance.zoomPreview($(this).data('hash'));
		});
		this.component.on('click', '.js-multi-image__popover-btn-delete', function (e) {
			thisInstance.deleteFile($(this).data('hash'));
		});
	}

	/**
	 * Prevent form submition
	 * @param {Event} e
	 */
	addButtonClick(e) {
		e.preventDefault();
		this.fileInput.trigger('click');
	}

	/**
	 * Submit event handler from jQuery-file-upload
	 *
	 * @param {Event} e
	 * @param {Object} data
	 */
	submit(e, data) {
		data.formData = {
			hash: data.files[0].hash
		};
	}

	/**
	 * Get file information
	 *
	 * @param {String} hash - file id
	 * @returns {Object}
	 */
	getFileInfo(hash) {
		for (let i = 0, len = this.files.length; i < len; i++) {
			const file = this.files[i];
			if (file.hash === hash) {
				return file;
			}
		}
		app.errorLog(new Error(`File '${hash}' not found.`));
	}

	/**
	 * Add property to file info object
	 *
	 * @param {String} hash - file id
	 * @param {String} propertyName
	 * @param {any} value
	 * @returns {Object}
	 */
	addFileInfoProperty(hash, propertyName, value) {
		const fileInfo = this.getFileInfo(hash);
		fileInfo[propertyName] = value;
		return fileInfo;
	}


	/**
	 * Error event handler from file upload request
	 * @param jqXHR
	 * @param textStatus
	 * @param errorThrown
	 */
	error(jqXHR, textStatus, errorThrown) {
		app.errorLog(new Error(app.vtranslate("JS_FILE_UPLOAD_ERROR")));
	}

	/**
	 * Success event handler from file upload request
	 *
	 * @param {Object} response
	 * @param {String} textStatus
	 * @param {jqXHR} jqXHR
	 */
	success(response, textStatus, jqXHR) {
		const attach = response.result.attach;
		const hash = attach.hash;
		if (!hash) {
			return app.errorLog(new Error(app.vtranslate("JS_INVALID_FILE_HASH") + ` [${hash}]`));
		}
		const fileInfo = this.getFileInfo(hash);
		this.addFileInfoProperty(hash, 'id', attach.id);
		this.addFileInfoProperty(hash, 'fileSize', attach.size);
		this.addFileInfoProperty(hash, 'name', attach.name);
		this.removePreviewPopover(hash);
		this.addPreviewPopover(fileInfo.file, fileInfo.previewElement, fileInfo.imageSrc);
		this.updateFormValues();
	}

	/**
	 * Update form input values
	 */
	updateFormValues() {
		const formValues = this.files.map(file => {
			return {id: file.id, name: file.name, size: file.fileSize};
		});
		this.valuesInput.val(JSON.stringify(formValues));
	}

	/**
	 * Add event handler from jQuery-file-upload
	 * @param {Event} e
	 * @param {object} data
	 */
	add(e, data) {
		data.files.forEach((file) => {
			if (typeof file.hash === 'undefined') {
				file.hash = App.Fields.Text.generateRandomHash(CONFIG.userId);
				this.files.push({hash: file.hash, imageSrc: file.imageSrc, name: file.name, file});
			}
		});
		data.submit()
			.success(this.success.bind(this))
			.error(this.error.bind(this));
	}

	/**
	 * Progressall event handler from jQuery-file-upload
	 * @param {Event} e
	 * @param {Object} data
	 */
	progressAll(e, data) {
		const progress = parseInt(data.loaded / data.total * 100, 10);
		this.progressBar.css({width: progress + "%"});
		if (progress === 100) {
			setTimeout(() => {
				this.progress.addClass('d-none');
				this.progressBar.css({width: "0%"});
			}, 1000);
		} else {
			this.progress.removeClass('d-none');
		}
	}

	/**
	 * Display modal window with large preview
	 *
	 * @param {string} hash
	 */
	zoomPreview(hash) {
		const thisInstance = this;
		const fileInfo = this.getFileInfo(hash);
		bootbox.dialog({
			size: 'large',
			backdrop: true,
			onEscape: true,
			title: `<i class="fa fa-image"></i> ${fileInfo.name}`,
			message: `<img src="${fileInfo.imageSrc}" class="w-100" />`,
			buttons: {
				Delete: {
					label: `<i class="fa fa-trash-alt"></i> ${app.vtranslate('JS_DELETE')}`,
					className: "float-left btn btn-danger",
					callback() {
						thisInstance.deleteFile(fileInfo.hash);
					}
				},
				Close: {
					label: `<i class="fa fa-times"></i> ${app.vtranslate('JS_CLOSE')}`,
					className: "btn btn-default",
					callback: () => {
					},
				}
			}
		});

	}

	/**
	 * Delete image from input field
	 * Should be called with this pointing on button element with data-hash attribute
	 * @param {string} hash
	 */
	deleteFile(hash) {
		const fileInfo = this.getFileInfo(hash);
		bootbox.confirm({
			title: `<i class="fa fa-trash-alt"></i> ${app.vtranslate("JS_DELETE_FILE")}`,
			message: `${app.vtranslate("JS_DELETE_FILE_CONFIRMATION")} <span class="font-weight-bold">${fileInfo.name}</span>?`,
			callback: (result) => {
				if (result) {
					fileInfo.previewElement.popover('dispose').remove();
					this.files = this.files.filter(file => file.hash !== fileInfo.hash);
					this.updateFormValues();
				}
			}
		});
	}

	/**
	 * File change event handler from jQuery-file-upload
	 *
	 * @param {Event} e
	 * @param {object} data
	 */
	change(e, data) {
		this.generatePreviewElements(data.files, (element) => {
			this.result.append(element);
		});
	}

	/**
	 * Generate and apply popover to preview
	 *
	 * @param {File} file
	 * @param {string} template
	 * @param {string} imageSrc
	 * @returns {jQuery}
	 */
	addPreviewPopover(file, template, imageSrc) {
		const thisInstance = this;
		let fileSize = '';
		const fileInfo = this.getFileInfo(file.hash);
		if (typeof fileInfo.fileSize !== 'undefined') {
			fileSize = `<span class="float-left badge badge-secondary">${fileInfo.fileSize}</span>`;
		}
		return $(template).popover({
			container: thisInstance.component,
			title: `<div class="u-text-ellipsis"><i class="fa fa-image"></i> ${file.name}</div>`,
			html: true,
			trigger: 'focus',
			placement: 'top',
			content: `<img src="${imageSrc}" class="w-100 js-multi-image__popover-img c-multi-image__popover-img" data-hash="${file.hash}" data-js="Fields.MultiImage"/>`,
			template: `<div class="popover" role="tooltip">
				<div class="arrow"></div>
				<h3 class="popover-header"></h3>
				<div class="popover-body"></div>
				<div class="text-right popover-footer js-multi-image__popover-actions">
					${fileSize}
					<button class="btn btn-sm btn-danger js-multi-image__popover-btn-delete" data-hash="${file.hash}" data-js="Fields.MultiImage"><i class="fa fa-trash-alt"></i> ${app.vtranslate('JS_DELETE')}</button>
					<button class="btn btn-sm btn-primary js-multi-image__popover-btn-zoom" data-hash="${file.hash}" data-js="Fields.MultiImage"><i class="fa fa-search-plus"></i> ${app.vtranslate('JS_ZOOM_IN')}</button>
				</div>
			</div>`
		});
	}

	/**
	 * Remove preview popover
	 *
	 * @param {String} hash
	 */
	removePreviewPopover(hash) {
		const fileInfo = this.getFileInfo(hash);
		if (typeof fileInfo.previewElement !== 'undefined') {
			fileInfo.previewElement.popover('dispose');
		}
	}

	/**
	 * Generate preview of images and append to multi image results view
	 *
	 * @param {Array} files - array of Files
	 * @param {function} callback
	 */
	generatePreviewElements(files, callback) {
		files.forEach((file) => {
			if (file instanceof File) {
				this.generatePreviewFromFile(file, (template, imageSrc) => {
					file.preview = this.addPreviewPopover(file, template, imageSrc);
					this.addFileInfoProperty(file.hash, 'previewElement', file.preview);
					callback(file.preview);
				});
			} else {
				// TODO: handle files from json (not File elements)
			}
		});
	}

	/**
	 * Generate preview of image as html string
	 * @param {File} file
	 * @param {function} callback
	 */
	generatePreviewFromFile(file, callback) {
		const fr = new FileReader();
		fr.onload = () => {
			file.imageSrc = fr.result;
			this.addFileInfoProperty(file.hash, 'imageSrc', file.imageSrc);
			this.addFileInfoProperty(file.hash, 'image', file.image);
			callback(`<div class="d-inline-block mr-1 mb-1 js-multi-image__preview" id="js-multi-image__preview-hash-${file.hash}" data-hash="${file.hash}" data-js="Fields.MultiImage">
					<div class="img-thumbnail js-multi-image__preview-img c-multi-image__preview-img" data-hash="${file.hash}" data-js="Fields.MultiImage" style="background-image:url(${fr.result})" tabindex="0" title="${file.name}"></div>
			</div>`, fr.result);
		};
		fr.readAsDataURL(file);
	}

}