export default {
	async create () {
		try {
			const resp = await campaigns_create.run();
			closeModal(ModalNewCampaign.name);

			await campaigns.run();

		} catch(e) {
			console.error("campaigns_create", e)
			showAlert('Campaign 创建出错，请稍后重试。', 'error');
		}		


	},
	async create_variant() {
		try {
			const resp = await campaign_variants_create.run();
			closeModal(ModalABTestVariant.name);

			await campaign_variants.run();

		} catch(e) {
			console.error("campaign_variants", e)
			showAlert('Campaign AB Test Variant创建出错，请稍后重试。', 'error');
		}		
	},
	get_left_percent(current) {
		let total = 100;
		for(let variant of campaign_variants.data) {
			if(current != variant.variant_id) {
				total -= variant.user_percentage;
			}
		}
		return total;
	},
	tomorrow() {
		const date = new Date();
		// 将日期加 1 天，JS 会自动处理跨月/跨年（例如 1月31日 + 1天 = 2月1日）
		date.setDate(date.getDate() + 1);

		// 使用 'en-CA' 区域设置，标准格式即为 YYYY-MM-DD
		return date.toLocaleDateString('en-CA');
	},
	async update_variant() {
		try {
			const resp = await campaign_variant_update.run();
			closeModal(ModalABTestVariantUpdate.name);

			await campaign_variants.run();

		} catch(e) {
			console.error("campaign_variants", e)
			showAlert('Update AB Test Variant创建出错，请稍后重试。', 'error');
		}		
	},
	async delete_varaint() {
		try {
			const resp = await campaign_variant_delete.run();
			closeModal(ModalDeleteVariant.name);

			await campaign_variants.run();

		} catch(e) {
			console.error("campaign_variants", e)
			showAlert('Delete AB Test Variant创建出错，请稍后重试。', 'error');
		}				
	},
	async scheduleEmail() {
		await campaigns_schedule.run();
		closeModal(ModalCampaignSchedule.name);

	},	
	async test_email() {
		try {
			await generate_test_emails.run();
			closeModal(ModalCampaignTestEmail.name);
		} catch(e) {
			console.error("test_email", e)
			showAlert('出错，请稍后重试。', 'error');
		}		
	}


}