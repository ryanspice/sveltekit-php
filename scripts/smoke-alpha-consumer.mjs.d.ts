export function assertPackageExportShape(packageJsonPath?: string): Promise<{
	name: string;
	version: string;
	private: boolean;
	adapterExport: string;
}>;
