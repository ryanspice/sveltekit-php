export function assertPackageExportShape(packageJsonPath?: string): Promise<{
	name: string;
	version: string;
	private: boolean;
	adapterExport: {
		types: string;
		import: string;
		default: string;
	};
}>;
