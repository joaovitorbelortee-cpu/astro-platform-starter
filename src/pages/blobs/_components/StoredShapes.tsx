import { useState, useEffect } from 'react';
import ShapePreview from './ShapePreview.tsx';
import { generateBlob } from '../../../utils';
import type { BlobProps } from '../../../types.ts';

interface Props {
    lastMutationTime: number;
}

export default function StoredShapes(props: Props) {
    const { lastMutationTime } = props;
    const [keys, setKeys] = useState<string[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<BlobProps | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getBlobKeyList = async () => {
        try {
            console.log('Fetching keys...');
            setError(null);
            const response = await fetch('/api/blobs', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data?.error ?? `Failed to fetch keys: ${response.status}`);
            }

            const data = await response.json();
            if (data.keys) {
                setKeys(data.keys);
            }
        } catch (err) {
            console.error('Unable to load blob keys', err);
            setKeys([]);
            setSelectedKey(null);
            setPreviewData(null);
            const message = err instanceof Error ? err.message : null;
            setError(message ?? 'Unable to connect to the server. Please ensure the backend is running.');
        }
    };

    const getBlobByKey = async (key: string) => {
        setSelectedKey(key);
        try {
            setError(null);
            const params = new URLSearchParams({ key });
            const response = await fetch(`/api/blob/?${params}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data?.error ?? `Failed to fetch blob: ${response.status}`);
            }

            const data = await response.json();
            if (data.blob) {
                setPreviewData(generateBlob(data.blob));
            }
        } catch (err) {
            console.error(`Unable to load blob with key ${key}`, err);
            setPreviewData(null);
            const message = err instanceof Error ? err.message : null;
            setError(message ?? 'Unable to connect to the server. Please ensure the backend is running.');
        }
    };

    useEffect(() => {
        getBlobKeyList();
    }, [lastMutationTime]);

    return (
        <>
            <h2 className="mb-4 text-xl text-center sm:text-xl">Objects in Blob Store</h2>
            <div className="w-full bg-white rounded-lg">
                <div className="p-4 text-center min-h-14">
                    {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
                    {keys?.length ? (
                        <div className="space-y-1">
                            {keys.map((keyName) => (
                                <button
                                    key={keyName}
                                    className={
                                        'inline-flex items-center justify-center w-full px-4 py-1.5 rounded-sm text-sm text-gray-900 cursor-pointer text-center transition hover:bg-complementary/20' +
                                        (selectedKey === keyName ? ' bg-complementary/20 pointer-events-none' : '')
                                    }
                                    onClick={() => {
                                        getBlobByKey(keyName);
                                    }}
                                >
                                    {keyName}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span className="text-gray-900">Please upload some shapes!</span>
                    )}
                </div>
                {previewData && (
                    <div className="p-4 border-t border-gray-200 aspect-square text-primary">
                        <ShapePreview {...previewData} />
                    </div>
                )}
            </div>
        </>
    );
}
