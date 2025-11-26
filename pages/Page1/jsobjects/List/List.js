export default {
	async load () {
		InputSQL.setValue(TableList.selectedRow.sql_query);
		InputExtractPrompt.setValue(TableList.selectedRow.extract_prompt);
	}
}