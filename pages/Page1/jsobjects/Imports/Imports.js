export default {
	myVar1: [],
	myVar2: {},
	myFun1 () {
		//	write code here
		//	this.myVar1 = [1,2,3]
	},
	async create_list () {
		try {
			const resp = await lists_create.run();

			storeValue("import_list_id", resp.list_id);
			const import_tasks = await imports_create_task.run();
			await lists.run();
			closeModal(ModalNewUserList.name);
		} catch(e) {
			console.error("generateResult", e)
			showAlert('生成出错，请稍后重试。', 'error');
		}		



		//	use async-await or promises
		//	await storeValue('varName', 'hello world')
	},
	async preview() {
		storeValue("import_columns_is_good", true);
		storeValue("TestSQL", InputSQL.text);
		storeValue("InputExtractPrompt", SwitchAIExtract.isSwitchedOn ? InputExtractPrompt.text : null);
		const resp = await imports_preview.run();
		const required  = ['name', 'email', 'country', 'region', 'city'];
		const isAllPresent = required.every(item => resp.columns.includes(item));
		if(!isAllPresent) {
			showAlert(required.join(',') + ' are must-have columns. Some are missing', 'error');
		}
	}
}