export default {
	async load () {
		InputListName.setValue(TableList.selectedRow.name);
		InputSQL.setValue(TableList.selectedRow.sql_query);
		InputExtractPrompt.setValue(TableList.selectedRow.extract_prompt);
	}
}