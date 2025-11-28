export default {
	/**
	 * 返回一个包含表格所有最新数据（包括已编辑和未编辑）的数组。
	 * 该函数模拟了"保存"动作后，表格数据源应有的最新状态。
	 * 假设表格名为 TableVariables。
	 * @returns {Array<Object>} 包含所有最新数据的数组
	 */
	getLatestTableDataArray: () => {
		// 1. 创建一个映射表 (Map) 来存储所有已编辑的行
		//    这样可以 O(1) 的速度查找最新值
		const updatedRowsMap = (TableVariables.updatedRows || []).reduce((map, updatedRowInfo) => {
			// updatedRowInfo.index 是该行在原始 tableData 中的索引
			// updatedRowInfo.allFields 包含了该行所有字段的最终值
			map.set(updatedRowInfo.index, updatedRowInfo.allFields);
			return map;
		}, new Map());

		// 2. 遍历原始数据 TableVariables.tableData
		const latestArray = TableVariables.tableData.map((originalRow, index) => {
			// 检查当前行在更新映射表中是否存在
			if (updatedRowsMap.has(index)) {
				// 如果存在，则返回映射表中的最新值
				return updatedRowsMap.get(index);
			} else {
				// 如果不存在，则返回原始行
				return originalRow;
			}
		});

		return latestArray;
	},

	getVariableDescObject: () => {
		// 1. 先从原始的 tableData 生成一个基础对象
		//    这一步保持不变，用于处理未被编辑的行
		const originalObject = TableVariables.tableData.reduce((acc, row) => {
			acc[row.variable_name] = row.description;
			return acc;
		}, {});

		// 2. 从 updatedRows 中提取更新后的内容
		//    关键更正：我们现在从每个元素的 allFields 属性中获取数据
		const updatedObject = (TableVariables.updatedRows || []).reduce((acc, updatedRowInfo) => {
			// 从 updatedRowInfo.allFields 中获取 variable_name 和 description
			const key = updatedRowInfo.allFields.variable_name;
			const value = updatedRowInfo.allFields.description;

			// 只有当 key 存在时才添加到对象中
			if (key) {
				acc[key] = value;
			}
			return acc;
		}, {});

		// 3. 将更新后的内容合并到基础对象上，实现覆盖
		return { ...originalObject, ...updatedObject };
	},	
	getVariableDefaultValueObject: () => {
		// 1. 先从原始的 tableData 生成一个基础对象
		//    这一步保持不变，用于处理未被编辑的行
		const originalObject = TableVariables.tableData.reduce((acc, row) => {
			acc[row.variable_name] = row.default_value;
			return acc;
		}, {});

		// 2. 从 updatedRows 中提取更新后的内容
		//    关键更正：我们现在从每个元素的 allFields 属性中获取数据
		const updatedObject = (TableVariables.updatedRows || []).reduce((acc, updatedRowInfo) => {
			// 从 updatedRowInfo.allFields 中获取 variable_name 和 description
			const key = updatedRowInfo.allFields.variable_name;
			const value = updatedRowInfo.allFields.default_value;

			// 只有当 key 存在时才添加到对象中
			if (key) {
				acc[key] = value;
			}
			return acc;
		}, {});

		// 3. 将更新后的内容合并到基础对象上，实现覆盖
		return { ...originalObject, ...updatedObject };
	},	
	/**
   * @param {string} templateString The original template string with {{variable_name}} placeholders.
   * @param {Array<Object>} variablesArray An array of objects, e.g., [{variable_name: 'name', default_value: 'there'}].
   * @returns {string} The transformed string in Klaviyo format.
   */
	convertToKlaviyo: (templateString, variablesObj) => {
		// 1. [修正] 检查输入是否有效
		//    使用 Object.keys().length 来判断对象是否为空
		if (!templateString || !variablesObj || Object.keys(variablesObj).length === 0) {
			console.log("what???")
			return templateString;
		}

		let klaviyoTemplate = templateString;

		// 2. [修正] 使用 for...in 循环来正确遍历对象的键值对
		for (const variableName in variablesObj) {
			// 这是一个好习惯，确保我们只处理对象自身的属性，而不是继承来的
			if (Object.prototype.hasOwnProperty.call(variablesObj, variableName)) {

				const defaultValue = variablesObj[variableName];

				// 3. [修正] 必须使用 RegExp 对象并带上 'g' 标志来进行全局替换
				//    同时，需要用 '\\' 来转义 '{' 和 '}'，因为它们在正则中有特殊含义
				const placeholderRegex = new RegExp(`\\{\\{${variableName}\\}\\}`, 'g');

				// 处理 default_value 中的单引号，防止破坏 Klaviyo 语法
				const escapedDefaultValue = String(defaultValue).replace(/'/g, "\\'");

				// 创建 Klaviyo 格式的替换字符串
				const klaviyoReplacement = `{{ person|lookup:"${variableName}"|default:'${escapedDefaultValue}' }}`;

				// 在模板中执行全局替换
				klaviyoTemplate = klaviyoTemplate.replace(placeholderRegex, klaviyoReplacement);
				console.log(defaultValue, variableName)
			}
		}

		return klaviyoTemplate;
	},
	generateKlaviyo: () => {
		const def_value =  this.getVariableDefaultValueObject();
		console.log(def_value);
		const klaviyo_template = this.convertToKlaviyo(RichTextEditorTemplate.text, def_value);
		storeValue("klaviyo_template", klaviyo_template);
		const klaviyo_subject = this.convertToKlaviyo(InputTemplateName.text, def_value);
		storeValue("klaviyo_subject", klaviyo_subject);

	},
	generateResult: async () => {
		try {
			const full = await generate_email.run();
			storeValue("prompt_full_result", full);
		} catch(e) {
			console.error("generateResult", e)
			showAlert('生成出错，请稍后重试。', 'error');
		}		
	},
	extractKeyword: async () => {
		try{
			const resp = await extract_template_variables.run();
			await storeValue('variables', []);
			await storeValue("variables", resp.variables);
		} catch(error) {
			console.error("extractKeyword", error)
			showAlert('生成出错，请稍后重试。', 'error');
		}

	},	
	/**
	 * 填充模版函数
	 * @param {string} template - 包含 {{key}} 或 {{key | "default"}} 的模版字符串
	 * @param {object} data - 包含键值对的 JSON 对象
	 * @returns {string} - 填充后的字符串
	 */
	fillTemplate(template, data) {
		// 正则匹配 {{ 和 }} 之间的内容，\s* 处理可能的空格
		return template.replace(/\{\{\s*(.*?)\s*\}\}/g, (match, content) => {
			// 1. 处理默认值逻辑：按 '||' 分割
			// content 可能是 "greeting_first_name" 或 "greeting_personalized_line || 'default value'"
			const parts = content.split('|');

			// 获取 key (取出第一部分并去除首尾空格)
			const key = parts[0].trim();

			// 2. 尝试从 data 中获取值
			const value = data[key];

			// 3. 如果值存在 (不是 undefined 或 null)，直接返回
			// 注意：这里允许空字符串 "" 或数字 0 通过
			if (value !== undefined && value !== null) {
				return value;
			}

			// 4. 如果 data 中没值，检查是否有默认值 (即 parts 长度大于 1)
			if (parts.length > 1) {
				// 获取 '||' 后面的部分，去除首尾空格
				let defaultValue = parts.slice(1).join('||').trim();

				// 去除默认值两边的引号 (" 或 ')
				defaultValue = defaultValue.replace(/^["']|["']$/g, '');

				return defaultValue;
			}

			// 5. 如果既没值也没默认值，返回空字符串 (或者你可以选择返回 match 以保留 {{key}})
			return ''; 
		});
	},
	testTemplate() {
		const selected = SelectTemplateTestEmail.selectedOptionValue;
		if (!selected) {
			return;
		}

		let selected_list_profile = null;
		for (const list_profile of lists_sample.data) {

			if (list_profile.list_profile_id == selected) {
				selected_list_profile = list_profile;
			}
		}

		if(!selected_list_profile) {
			console.log("not found " + selected);
			return;
		}

		let kv = {
			...selected_list_profile,
			"campaign": "test_campaign",
			"variant": "test_variant",
			"unsubscribe_url": "https://www.topview.ai"
		}


		const subject = this.fillTemplate(InputTemplateSubject.text, kv);
		const email_content = this.fillTemplate(RichTextEditorTemplate.text, kv);

		console.log(subject);
		console.log(email_content);

		InputTemplateTestSubject.setValue(subject);
		storeValue("RichTextEditorTemplateResult", email_content);

	},
	async uploadImage() {
		// 1. 校验是否选择了文件
		if (!FilePickerImage.files || FilePickerImage.files.length === 0) {
			showAlert('请先选择一张图片', 'warning');
			return;
		}

		try {
			// 2. 获取文件名后缀进行简单的预判（可选，后端也会校验）
			const file = FilePickerImage.files[0];
			const fileName = file.name || "";
			// 简单检查后缀，具体逻辑以你后端为准
			if (!fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
				showAlert('不支持的文件格式', 'error');
				return;
			}

			// 3. 调用 API 并传递参数
			// 这里的 folderName 对应 API 配置里的 {{this.params.folderName}}
			// 你可以把 "email-marketing" 改成从某个 Input 组件获取，例如 InputFolder.text
			const response = await upload_image.run();

			// 4. 处理成功响应
			if (response && response.url) {
				showAlert('上传成功！', 'success');
				storeValue("upload_image", response.url);
				console.log("S3 URL:", response.url);

				// 比如：将返回的 URL 显示在一个 Text 组件或 Image 组件中
				// storeValue('uploadedUrl', response.url); 
			} else {
				storeValue("upload_image", null);
				showAlert('上传成功，但未返回URL', 'info');
			}

		} catch (error) {
			// 5. 错误处理
			console.error(error);
			// 尝试读取后端返回的 detail 错误信息
			if (upload_image.data && upload_image.data.detail) {
				showAlert('上传失败: ' + upload_image.data.detail, 'error');
			} else {
				showAlert('上传失败，请检查网络或控制台', 'error');
			}
		}		
	},
	async createTemplate() {
		const resp = await templates_create.run();
		await templates.run();
	},
	async cloneTemplate() {
		const selectedTemplate = await templates_load.run();
		await templates.run();
	},	
	async deleteTemplateConfirmed() {
		const resp = await templates_delete.run();
		closeModal(ModalDeleteTemplate.name);
		await templates.run();
	},
	async loadTemplate() {
		const selectedTemplate = await templates_load.run();

		InputTemplateSubject.setValue(selectedTemplate.subject);
		storeValue("RichTextEditorTemplate", selectedTemplate.content);
		storeValue("TemplateChanged", false);
	},
	async tableSaveTemplate() {

		await templates_update_table.run();
		await templates.run();
	},
	async saveTemplate() {
		await templates_update_button.run();
		await templates.run();
	},
	templateChanged() {
		storeValue("TemplateChanged", true);
	}
}